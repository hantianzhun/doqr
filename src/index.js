import { html } from './utils.js'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const pathname = url.pathname

    if (request.method === 'POST' && pathname === '/api/create') {
      // ...原创建代码不变...
      const form = await request.formData()
      const targetUrl = form.get('url')?.trim()
      const customCode = form.get('code')?.trim()

      if (!targetUrl || !customCode) {
        return new Response(
          JSON.stringify({ error: '请提供目标链接和自定义短码' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      try {
        await env.DB.prepare('INSERT INTO links (code, url) VALUES (?, ?)').bind(customCode, targetUrl).run()
      } catch (e) {
        return new Response(
          JSON.stringify({ error: '短码已存在，请更换自定义码' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const shortUrl = `${url.origin}/${customCode}`
      return new Response(
        JSON.stringify({ code: customCode, shortUrl }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (request.method === 'POST' && pathname === '/api/update') {
      // ...更新代码不变...
      const form = await request.formData()
      const code = form.get('code')?.trim()
      const newUrl = form.get('url')?.trim()

      if (!code || !newUrl) {
        return new Response(
          JSON.stringify({ error: '请提供短码和新的目标链接' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      try {
        const result = await env.DB.prepare('UPDATE links SET url = ? WHERE code = ?').bind(newUrl, code).run()
        if (result.changes === 0) {
          return new Response(
            JSON.stringify({ error: '短码不存在' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          )
        }
        return new Response(
          JSON.stringify({ message: '更新成功' }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      } catch (e) {
        return new Response(
          JSON.stringify({ error: e.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // 新增 - 返回全部短码列表接口
    if (request.method === 'GET' && pathname === '/api/list') {
      try {
        const { results } = await env.DB.prepare('SELECT code, url FROM links ORDER BY code').all()
        return new Response(JSON.stringify(results), {
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    if (pathname === '/') {
      return new Response(html, { headers: { 'Content-Type': 'text/html;charset=utf-8' } })
    }

    const code = pathname.slice(1)
    if (!code) {
      return new Response('请输入短码', { status: 400 })
    }

    const { results } = await env.DB.prepare('SELECT url FROM links WHERE code = ?').bind(code).all()
    if (results.length > 0) {
      return Response.redirect(results[0].url, 302)
    }

    return new Response('未找到短码对应的链接', { status: 404 })
  },
}
