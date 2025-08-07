export const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>短链管理</title>
  <style>
    body {
      font-family: sans-serif;
      padding: 2rem;
      background: #f7f7f7;
    }
    h1 {
      margin-bottom: 1rem;
    }
    form {
      margin-bottom: 2rem;
    }
    input[type="text"], input[type="url"] {
      padding: 0.5rem;
      margin-right: 0.5rem;
      width: 200px;
    }
    button {
      padding: 0.5rem 1rem;
      margin-left: 0.5rem;
    }
    .entry {
      background: white;
      padding: 1rem;
      margin-bottom: 0.5rem;
      border-radius: 6px;
      border: 1px solid #ccc;
    }
    .details {
      margin-top: 0.5rem;
      display: none;
    }
    .entry.open .details {
      display: block;
    }
    .actions {
      margin-top: 0.5rem;
    }
    .code-url {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .code-url span {
      font-weight: bold;
      cursor: pointer;
    }
    .code-url button {
      margin-left: 1rem;
    }
    .edit-url {
      width: 100%;
      padding: 0.5rem;
      margin-top: 0.5rem;
    }
  </style>
</head>
<body>
  <h1>短链管理</h1>

  <form id="createForm">
    <input type="text" name="code" placeholder="短码，如: abc123" required />
    <input type="url" name="url" placeholder="目标链接，如: https://example.com" required />
    <button type="submit">创建</button>
  </form>

  <div id="list"></div>

  <script>
    async function fetchList() {
      const res = await fetch('/api/list')
      const items = await res.json()
      const list = document.getElementById('list')
      list.innerHTML = ''

      items.forEach(({ code, url }) => {
        const div = document.createElement('div')
        div.className = 'entry'
        div.innerHTML = \`
          <div class="code-url">
            <span onclick="this.parentNode.parentNode.classList.toggle('open')">短码：<a href="/\${code}" target="_blank">\${code}</a></span>
            <div>
              <button onclick="deleteCode('\${code}')">删除</button>
            </div>
          </div>
          <div class="details">
            <div>
              当前链接：<a href="\${url}" target="_blank">\${url}</a>
            </div>
            <div class="actions">
              <input type="url" placeholder="修改后的链接" class="edit-url" value="\${url}" />
              <button onclick="updateUrl('\${code}', this.previousElementSibling.value)">保存修改</button>
            </div>
          </div>
        \`
        list.appendChild(div)
      })
    }

    async function deleteCode(code) {
      const form = new FormData()
      form.append('code', code)
      await fetch('/api/delete', { method: 'POST', body: form })
      fetchList()
    }

    async function updateUrl(code, newUrl) {
      const form = new FormData()
      form.append('code', code)
      form.append('url', newUrl)
      await fetch('/api/update', { method: 'POST', body: form })
      fetchList()
    }

    document.getElementById('createForm').addEventListener('submit', async e => {
      e.preventDefault()
      const form = new FormData(e.target)
      const res = await fetch('/api/create', { method: 'POST', body: form })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || '创建失败')
        return
      }

      e.target.reset()
      fetchList()
    })

    fetchList()
  </script>
</body>
</html>
`
