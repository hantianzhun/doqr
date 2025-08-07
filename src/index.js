import { html } from './utils.js'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const pathname = url.pathname

    if (request.method === 'POST' && pathname === '/api/create') {
      const form = await request.formData()
      const targetUrl = form.get('url')
      const customCode = form.get('code')?.trim()

      const code = customCode || Math.random().toString(36).substring(2, 8)

      try {
        await env.DB.prepare('INSERT INTO links (code, url) VALUES (?, ?)').bind(code, targetUrl).run()
      } catch (e) {
        return new Response(JSON.stringify({ error: '短码已存在，请更换自定义码' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }

      const shortUrl = `${url.origin}/${code}`

      return new Response(JSON.stringify({ code, shortUrl }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (request.method === 'POST' && pathname === '/api/update') {
      const form = await request.formData()
      const code = form.get('code')?.trim()
      const newUrl = form.get('url')?.trim()

      const { success } = await env.DB.prepare('UPDATE links SET url = ? WHERE code = ?')
        .bind(newUrl, code)
        .run()

      if (success) {
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
      } else {
        return new Response(JSON.stringify({ error: '更新失败或短码不存在' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }
    }

    if (request.method === 'GET' && pathname === '/api/list') {
      const { results } = await env.DB.prepare('SELECT code, url FROM links ORDER BY code ASC').all()
      return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } })
    }

    if (request.method === 'POST' && pathname === '/api/delete') {
      const form = await request.formData()
      const code = form.get('code')?.trim()

      const { success } = await env.DB.prepare('DELETE FROM links WHERE code = ?').bind(code).run()

      if (success) {
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
      } else {
        return new Response(JSON.stringify({ error: '删除失败，短码可能不存在' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }
    }

    if (pathname === '/') {
      return new Response(html, { headers: { 'Content-Type': 'text/html' } })
    }

    const code = pathname.slice(1)
    if (!code) {
      return new Response('请输入短码', { status: 400 })
    }

    const { results } = await env.DB.prepare('SELECT url FROM links WHERE code = ?').bind(code).all()

    if (results.length > 0) {
      return Response.redirect(results[0].url, 302)
    }

    return new Response('Not Found', { status: 404 })
  },
}
