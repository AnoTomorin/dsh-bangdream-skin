import { access, mkdir, open, readFile, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'

const SETTINGS_NS = settingsNamespace('bngd-ui')

const BngdSettingsSchema = z.object({
  wallpaperOn: z.boolean().default(true),
  themeOn: z.boolean().default(true),
  roseliaOn: z.boolean().default(false),
  particlesOn: z.boolean().default(true),
})

/** Hard cap on an uploaded wallpaper payload. */
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

/**
 * Durable storage for the user-picked wallpaper: a copy of the bytes lives
 * under the harness home so deleting the original file never breaks the UI.
 */
function storagePaths() {
  const dir = join(resolveDshHome(), 'storages', 'bngd-ui')
  return { dir, image: join(dir, 'wallpaper.bin'), meta: join(dir, 'wallpaper.json') }
}

/* ---------- theme BGM ---------- */

/** BGM files shipped inside this package (lib/bgm), served by filename. */
const BGM_DIR = fileURLToPath(new URL('./bgm/', import.meta.url))
/** Band skin files shipped inside this package (optional, installer-populated). */
const SKIN_DIR = fileURLToPath(new URL('./skin/', import.meta.url))
const SKIN_TYPES = {
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
}
const BAND_WALLPAPERS = {
  'poppin-party': '户山香澄.png',
  'afterglow': '美竹兰.png',
  'roselia': '友希那.png',
  'pastel-palettes': '丸山彩.png',
  'hello-happy-world': '弦卷心.png',
  'morfonica': '仓田真白.png',
  'raise-a-suilen': '和奏瑞依.png',
  'mygo': '高松灯.png',
}
async function findWallpaperName(dir, band, preferred) {
  try {
    const names = await readdir(join(dir, band))
    if (names.includes(preferred)) return preferred
    const matched = names.find((name) => /背景.*\.(png|webp|jpg|jpeg|gif)$/i.test(name))
    return matched || preferred
  } catch {
    return preferred
  }
}





const BGM_TYPES = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
}

async function listBgm() {
  try {
    return (await readdir(BGM_DIR)).filter((name) => BGM_TYPES[extname(name).toLowerCase()] !== void 0)
  } catch {
    return []
  }
}

/** Read the byte range [start, end] inclusive from a file. */
async function readFileRange(file, start, end) {
  const fh = await open(file, 'r')
  try {
    const len = end - start + 1
    const buf = Buffer.alloc(len)
    const { bytesRead } = await fh.read(buf, 0, len, start)
    return buf.subarray(0, bytesRead)
  } finally {
    await fh.close()
  }
}

/* ---------- helpers ---------- */

/** Identify the image format from magic bytes, or null when unsupported. */
function sniffImageType(buf) {
  if (!buf || buf.length < 8) return null
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg'
  if (buf.toString('latin1', 0, 8) === '\x89PNG\r\n\x1a\n') return 'image/png'
  if (buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'image/webp'
  if (buf.length >= 6) {
    const head = buf.toString('latin1', 0, 6)
    if (head === 'GIF87a' || head === 'GIF89a') return 'image/gif'
  }
  return null
}

/** Collect the request body into one Buffer, rejecting past the size cap. */
function collectBody(req, cap) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    let done = false
    req.on('data', (chunk) => {
      if (done) return
      size += chunk.length
      if (size > cap) {
        done = true
        reject(new Error('payload too large'))
        req.resume() // drain the remainder so the connection stays usable
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (done) return
      done = true
      resolve(Buffer.concat(chunks))
    })
    req.on('error', (error) => {
      if (done) return
      done = true
      reject(error)
    })
  })
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-cache',
  })
  res.end(JSON.stringify(payload))
}

const plugin = {
  name: '@local/bngd-ui',
  apply(ctx, config) {
    ctx.inject(['settings'], (settingsCtx) => {
      settingsCtx.settings.register(SETTINGS_NS, BngdSettingsSchema)
    })

    const wallpaperPath =
      config && typeof config.wallpaperPath === 'string'
        ? config.wallpaperPath
        : ''
      const characterPath =
        config && typeof config.characterPath === 'string'
          ? config.characterPath
          : ''
      const skinAssetsPath =
        config && typeof config.skinAssetsPath === 'string'
          ? config.skinAssetsPath
          : ''



    ctx.inject(['webServer'], (httpCtx) => {
      httpCtx.effect(() => httpCtx.webServer.register({
        kind: 'prefix',
        path: '/bngd-ui',
        handler: async (req, res) => {
          const rawPath = (req.url || '/').split('?')[0]

          // GET /bngd-ui/bgm/<file> — theme BGM with Range support.
          const bgmMatch = /^\/bngd-ui\/bgm\/([^/]+)$/.exec(rawPath)
          if (bgmMatch !== null) {
            if (req.method !== 'GET' && req.method !== 'HEAD') {
              res.writeHead(405)
              res.end()
              return
            }
            const name = bgmMatch[1]
            if (!/^[A-Za-z0-9._-]+$/.test(name)) {
              res.writeHead(400)
              res.end()
              return
            }
            const files = await listBgm()
            if (!files.includes(name)) {
              res.writeHead(404)
              res.end()
              return
            }
            const file = join(BGM_DIR, name)
            const type = BGM_TYPES[extname(name).toLowerCase()]
            try {
              const info = await stat(file)
              const total = info.size
              const range = req.headers.range
              if (typeof range === 'string') {
                const m = /^bytes=(\d*)-(\d*)$/.exec(range)
                if (m !== null) {
                  let start
                  let end
                  if (m[1] === '' && m[2] !== '') {
                    // suffix range: last N bytes
                    const suffix = parseInt(m[2], 10)
                    start = Math.max(0, total - suffix)
                    end = total - 1
                  } else {
                    start = m[1] === '' ? 0 : parseInt(m[1], 10)
                    end = m[2] === '' ? total - 1 : Math.min(parseInt(m[2], 10), total - 1)
                  }
                  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= total) {
                    res.writeHead(416, { 'content-range': 'bytes */' + total })
                    res.end()
                    return
                  }
                  const chunk = await readFileRange(file, start, end)
                  res.writeHead(206, {
                    'content-type': type,
                    'content-length': chunk.length,
                    'accept-ranges': 'bytes',
                    'content-range': 'bytes ' + start + '-' + end + '/' + total,
                    'cache-control': 'no-cache',
                  })
                  res.end(chunk)
                  return
                }
              }
              const body = await readFile(file)
              res.writeHead(200, {
                'content-type': type,
                'content-length': total,
                'accept-ranges': 'bytes',
                'cache-control': 'no-cache',
              })
              res.end(body)
            } catch {
              res.writeHead(404)
              res.end()
            }
            return
          }


            // GET /bngd-ui/skin/<band>/<file> — read the live material folder
            // first so replacing PNGs takes effect without reinstalling; the
            // package-local mirror remains as the offline fallback.
            if (rawPath.startsWith('/bngd-ui/skin/')) {
              if (req.method !== 'GET' && req.method !== 'HEAD') {
                res.writeHead(405)
                res.end()
                return
              }
              const rel = rawPath.slice('/bngd-ui/skin/'.length)
              const segs = rel.split('/')
              if (segs.length < 2 || segs.some((seg) => seg === '' || seg === '.' || seg === '..' || !/^[A-Za-z0-9._-]+$/.test(seg))) {
                res.writeHead(400)
                res.end()
                return
              }
              const ext = extname(segs[segs.length - 1]).toLowerCase()
              let body = null
              let contentType = SKIN_TYPES[ext] || null
              if (skinAssetsPath !== '') {
                try {
                  body = await readFile(join(skinAssetsPath, rel))
                  if (contentType === null) contentType = sniffImageType(body)
                } catch {
                  body = null
                }
              }
              if (body === null) {
                try {
                  body = await readFile(join(SKIN_DIR, rel))
                } catch {
                  body = null
                }
              }
              if (body === null || contentType === null) {
                res.writeHead(body === null ? 404 : 415)
                res.end()
                return
              }
              res.writeHead(200, {
                'content-type': contentType,
                'content-length': body.length,
                'cache-control': 'no-cache',
              })
              res.end(body)
              return
            }

            // GET /bngd-ui/skin/<band>/<file> — band skin assets. Prefer the
            // package-local mirror, then fall back to skinAssetsPath.
            if (rawPath.startsWith('/bngd-ui/skin/')) {
              if (req.method !== 'GET' && req.method !== 'HEAD') {
                res.writeHead(405)
                res.end()
                return
              }
              const rel = rawPath.slice('/bngd-ui/skin/'.length)
              const segs = rel.split('/')
              if (segs.length < 2 || segs.some((seg) => seg === '' || seg === '.' || seg === '..' || !/^[A-Za-z0-9._-]+$/.test(seg))) {
                res.writeHead(400)
                res.end()
                return
              }
              const ext = extname(segs[segs.length - 1]).toLowerCase()
              let body = null
              let contentType = SKIN_TYPES[ext] || null
              try {
                if (skinAssetsPath === '') throw new Error('skinAssetsPath is not configured')
                  body = await readFile(join(skinAssetsPath, rel))
              } catch {
                body = null
              }
              if (body === null) {
                try {
                  body = await readFile(join(skinAssetsPath, rel))
                  if (contentType === null) contentType = sniffImageType(body)
                } catch {
                  body = null
                }
              }
              if (body === null || contentType === null) {
                res.writeHead(body === null ? 404 : 415)
                res.end()
                return
              }
              res.writeHead(200, {
                'content-type': contentType,
                'content-length': body.length,
                'cache-control': 'no-cache',
              })
              res.end(body)
              return
            }


            // GET /bngd-ui/character.webp — Kasumi full-body art. Prefer the
            // package-local mirror (populated by bngd-ui.ps1 -Install), then
            // fall back to the configured source asset path.
            if (rawPath === '/bngd-ui/character.webp') {
              if (req.method !== 'GET' && req.method !== 'HEAD') {
                res.writeHead(405)
                res.end()
                return
              }
              let body = null
              let contentType = 'image/webp'
              try {
                body = await readFile(join(SKIN_DIR, 'poppin-party', 'img_toyama-kasumi_1.webp'))
              } catch {
                body = null
              }
              if (body === null && characterPath !== '') {
                try {
                  body = await readFile(characterPath)
                  contentType = sniffImageType(body) || contentType
                } catch {
                  body = null
                }
              }
              if (body === null) {
                res.writeHead(404)
                res.end()
                return
              }
              res.writeHead(200, {
                'content-type': contentType,
                'content-length': body.length,
                'cache-control': 'no-cache',
              })
              res.end(body)
              return
            }


            // GET /bngd-ui/wallpaper.jpg?band=<band> — priority:
            // user-uploaded copy > band default background > wallpaperPath.
            if (rawPath === '/bngd-ui/wallpaper.jpg') {
              if (req.method !== 'GET' && req.method !== 'HEAD') {
                res.writeHead(405)
                res.end()
                return
              }
              const paths = storagePaths()
              let body = null
              let contentType = null
              try {
                body = await readFile(paths.image)
                try {
                  const meta = JSON.parse(await readFile(paths.meta, 'utf8'))
                  if (typeof meta.contentType === 'string') contentType = meta.contentType
                } catch {
                  /* meta missing or broken — sniff below */
                }
                if (contentType === null) contentType = sniffImageType(body)
              } catch {
                body = null
              }

              const qIndex = (req.url || '').indexOf('?')
              const band = new URLSearchParams(qIndex >= 0 ? (req.url || '').slice(qIndex + 1) : '').get('band') || ''
              const wallpaperName = band !== '' ? BAND_WALLPAPERS[band] : ''
                let wallpaperResolved = wallpaperName

              if (body === null && wallpaperName !== void 0 && wallpaperName !== '') {
                if (skinAssetsPath !== '') {
                  try {
                    wallpaperResolved = await findWallpaperName(skinAssetsPath, band, wallpaperName)
                      body = await readFile(join(skinAssetsPath, band, wallpaperResolved))
                    contentType = sniffImageType(body)
                  } catch {
                    body = null
                  }
                }
                if (body === null) {
                  try {
                    wallpaperResolved = await findWallpaperName(SKIN_DIR, band, wallpaperName)
                      body = await readFile(join(SKIN_DIR, band, wallpaperResolved))
                    contentType = sniffImageType(body)
                  } catch {
                    body = null
                  }
                }
              }
                if (body !== null && contentType === null && wallpaperName !== '') {
                  contentType = SKIN_TYPES[extname(wallpaperResolved).toLowerCase()] || null
                }

              if (body === null && wallpaperPath !== '') {
                try {
                  body = await readFile(wallpaperPath)
                  contentType = 'image/jpeg'
                } catch {
                  body = null
                }
              }

              if (body === null) {
                res.writeHead(404)
                res.end()
                return
              }
              res.writeHead(200, {
                'content-type': contentType || 'image/jpeg',
                'content-length': body.length,
                'cache-control': 'no-cache',
              })
              res.end(body)
              return
            }


          // GET /bngd-ui/wallpaper.jpg — serve the uploaded copy first,
          // then fall back to the configured wallpaperPath file.
          if (rawPath === '/bngd-ui/wallpaper.jpg') {
            if (req.method !== 'GET' && req.method !== 'HEAD') {
              res.writeHead(405)
              res.end()
              return
            }
            const paths = storagePaths()
            let body = null
            let contentType = null
            try {
              body = await readFile(paths.image)
              try {
                const meta = JSON.parse(await readFile(paths.meta, 'utf8'))
                if (typeof meta.contentType === 'string') contentType = meta.contentType
              } catch {
                /* meta missing or broken — sniff below */
              }
              if (contentType === null) contentType = sniffImageType(body)
            } catch {
              if (wallpaperPath !== '') {
                try {
                  body = await readFile(wallpaperPath)
                  contentType = 'image/jpeg'
                } catch {
                  body = null
                }
              }
            }
            if (body === null) {
              res.writeHead(404)
              res.end()
              return
            }
            res.writeHead(200, {
              'content-type': contentType || 'image/jpeg',
              'cache-control': 'no-cache',
            })
            res.end(body)
            return
          }

          // GET /bngd-ui/wallpaper-status — whether a user-picked copy exists.
          if (rawPath === '/bngd-ui/wallpaper-status') {
            if (req.method !== 'GET' && req.method !== 'HEAD') {
              sendJson(res, 405, { ok: false, error: 'method not allowed' })
              return
            }
            let custom = false
            try {
              await access(storagePaths().image)
              custom = true
            } catch {
              custom = false
            }
            sendJson(res, 200, { custom })
            return
          }

          // POST /bngd-ui/wallpaper — store a new user-picked image.
          // DELETE /bngd-ui/wallpaper — remove it and fall back to default.
          if (rawPath === '/bngd-ui/wallpaper') {
            if (req.method === 'POST') {
              let body
              try {
                body = await collectBody(req, MAX_UPLOAD_BYTES)
              } catch (error) {
                sendJson(res, 413, { ok: false, error: String(error && error.message ? error.message : error) })
                return
              }
              const contentType = sniffImageType(body)
              if (contentType === null) {
                sendJson(res, 400, { ok: false, error: 'unsupported image type (use jpeg/png/webp/gif)' })
                return
              }
              try {
                const paths = storagePaths()
                await mkdir(paths.dir, { recursive: true })
                const tmp = paths.image + '.tmp'
                await writeFile(tmp, body)
                await writeFile(paths.meta, JSON.stringify({
                  contentType,
                  size: body.length,
                  savedAt: new Date().toISOString(),
                }))
                await rename(tmp, paths.image)
                sendJson(res, 200, { ok: true, custom: true, contentType, size: body.length })
              } catch (error) {
                sendJson(res, 500, { ok: false, error: String(error && error.message ? error.message : error) })
              }
              return
            }
            if (req.method === 'DELETE') {
              try {
                const paths = storagePaths()
                try {
                  await unlink(paths.image)
                } catch {
                  /* already gone */
                }
                try {
                  await unlink(paths.meta)
                } catch {
                  /* already gone */
                }
                sendJson(res, 200, { ok: true, custom: false })
              } catch (error) {
                sendJson(res, 500, { ok: false, error: String(error && error.message ? error.message : error) })
              }
              return
            }
            sendJson(res, 405, { ok: false, error: 'method not allowed (use POST or DELETE)' })
            return
          }

          res.writeHead(404)
          res.end()
        },
      }), 'bngd-ui: wallpaper, bgm, skin, character & upload routes')
    })
  },
}

export default plugin
