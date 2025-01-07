document.addEventListener('DOMContentLoaded', function() {
  const queryButton = document.getElementById('queryButton');
  const dedupeButton = document.getElementById('dedupeButton');
  const copyButton = document.getElementById('copyButton');
  const ipInput = document.getElementById('ipInput');
  const results = document.getElementById('results');

  // 去重功能
  dedupeButton.addEventListener('click', () => {
    const ips = ipInput.value.split('\n').filter(ip => ip.trim());
    if (ips.length === 0) {
      return;
    }
    
    // 使用Set去重并保持原有顺序
    const uniqueIps = [...new Set(ips)];
    ipInput.value = uniqueIps.join('\n');
    
    // 显示去重结果
    const removedCount = ips.length - uniqueIps.length;
    if (removedCount > 0) {
      results.innerHTML = `<p>已去除 ${removedCount} 个重复IP</p>`;
    } else {
      results.innerHTML = '<p>没有发现重复IP</p>';
    }
  });

  // 复制功能
  copyButton.addEventListener('click', () => {
    const resultsText = Array.from(results.querySelectorAll('.result-item p'))
      .map(p => p.textContent)
      .join('\n');
    
    if (!resultsText) {
      results.innerHTML = '<p class="error">没有可复制的内容</p>';
      return;
    }

    // 创建临时textarea来实现复制
    const textarea = document.createElement('textarea');
    textarea.value = resultsText;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      results.innerHTML = '<p>查询结果已复制到剪贴板</p>';
    } catch (err) {
      results.innerHTML = '<p class="error">复制失败: ' + err.message + '</p>';
    } finally {
      document.body.removeChild(textarea);
    }
  });

  // 查询功能
  queryButton.addEventListener('click', async () => {
    const ips = ipInput.value.split('\n').filter(ip => ip.trim());
    
    if (ips.length === 0) {
      results.innerHTML = '<p class="error">请输入至少一个IP地址</p>';
      return;
    }
    
    results.innerHTML = '<p>正在查询中...</p>';
    
    try {
      // 串行查询所有IP
      const responses = [];
      for (const ip of ips) {
        try {
          const response = await fetch(`https://api.qjqq.cn/api/district?ip=${ip}`);
          const data = await response.json();
          responses.push(data);
        } catch (error) {
          console.error('查询失败:', ip, error);
          responses.push({
            code: 500,
            msg: error.message,
            ip: ip
          });
        }
      }

      // 更新结果显示
      const resultsDiv = document.getElementById('results');
      if (!responses || responses.length === 0) {
        resultsDiv.innerHTML = '<p>未查询到结果</p>';
        return;
      }

      const html = responses.map(item => {
        if (item.code === 200) {
          // 格式化地理位置信息
          const location = [
            item.data.continent,
            item.data.country,
            item.data.prov,
            item.data.city
          ].filter(Boolean).join('-');  // 过滤掉空值并用-连接

          return `
            <div class="result-item">
              <p>${item.data.ip} => ${location}-${item.data.isp}</p>
            </div>
          `;
        } else {
          return `
            <div class="result-item error">
              <p>${item.ip} => 查询失败: ${item.msg || '未知错误'}</p>
            </div>
          `;
        }
      }).join('');

      resultsDiv.innerHTML = html;

    } catch (error) {
      results.innerHTML = `<p class="error">查询出错: ${error.message}</p>`;
      console.error('查询错误:', error);
    }
  });
}); 