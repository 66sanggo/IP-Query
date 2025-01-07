document.addEventListener('DOMContentLoaded', function() {
  const queryButton = document.getElementById('queryButton');
  const dedupeButton = document.getElementById('dedupeButton');
  const copyButton = document.getElementById('copyButton');
  const clearButton = document.getElementById('clearButton');
  const ipInput = document.getElementById('ipInput');
  const results = document.getElementById('results');
  const filterButtons = document.getElementById('filterButtons');
  let allResults = []; // 存储所有查询结果

  // 加载保存的数据
  loadSavedData();

  // 清除功能
  clearButton.addEventListener('click', () => {
    ipInput.value = '';
    results.innerHTML = '';
    // 清除保存的数据
    chrome.storage.local.remove(['savedIPs', 'savedResults'], () => {
      results.innerHTML = '<p>数据已清除</p>';
    });
  });

  // 去重功能
  dedupeButton.addEventListener('click', () => {
    const ips = ipInput.value.split('\n').filter(ip => ip.trim());
    if (ips.length === 0) {
      return;
    }
    
    const uniqueIps = [...new Set(ips)];
    ipInput.value = uniqueIps.join('\n');
    
    const removedCount = ips.length - uniqueIps.length;
    if (removedCount > 0) {
      results.innerHTML = `<p>已去除 ${removedCount} 个重复IP</p>`;
    } else {
      results.innerHTML = '<p>没有发现重复IP</p>';
    }

    // 保存输入的IP
    saveData();
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
    filterButtons.style.display = 'none';
    
    try {
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

      allResults = responses; // 保存所有结果
      displayResults(responses);
      filterButtons.style.display = 'flex'; // 显示筛选按钮

    } catch (error) {
      results.innerHTML = `<p class="error">查询出错: ${error.message}</p>`;
      console.error('查询错误:', error);
    }
  });

  // 筛选功能
  filterButtons.addEventListener('click', (e) => {
    if (!e.target.classList.contains('btn-filter')) return;
    
    const button = e.target;
    const filterType = button.dataset.filter;

    // 切换按钮状态
    if (button.classList.contains('active')) {
      // 如果按钮已经是激活状态，则取消选中并显示所有结果
      button.classList.remove('active');
      displayResults(allResults);
    } else {
      // 取消其他按钮的选中状态
      document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.classList.remove('active');
      });
      // 选中当前按钮并过滤结果
      button.classList.add('active');
      const filteredResults = filterResults(allResults, filterType);
      displayResults(filteredResults);
    }
  });

  function filterResults(results, type) {
    return results.filter(item => {
      if (!item.code === 200) return false;
      
      const isp = item.data.isp?.toLowerCase() || '';
      const country = item.data.country || '';
      const region = item.data.prov || '';

      switch (type) {
        case 'foreign':
          return country && country !== '中国';
        case 'mobile':
          return isp.includes('移动');
        case 'telecom':
          return isp.includes('电信');
        case 'unicom':
          return isp.includes('联通');
        case 'hmt':
          return region.includes('香港') || 
                 region.includes('澳门') || 
                 region.includes('台湾');
        case 'other':
          return !isp.includes('移动') && 
                 !isp.includes('电信') && 
                 !isp.includes('联通') &&
                 country === '中国' &&
                 !region.includes('香港') && 
                 !region.includes('澳门') && 
                 !region.includes('台湾');
        default:
          return true;
      }
    });
  }

  function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    if (!results || results.length === 0) {
      resultsDiv.innerHTML = '<p>未查询到结果</p>';
      return;
    }

    const html = results.map(item => {
      if (item.code === 200) {
        const location = [
          // 移除 continent 字段
          item.data.country,
          item.data.prov,
          item.data.city
        ].filter(Boolean).join('-');

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
    saveData(html);
  }

  // 监听输入变化，保存数据
  ipInput.addEventListener('input', () => {
    saveData();
  });

  // 保存数据函数
  function saveData(resultsHtml) {
    chrome.storage.local.set({
      savedIPs: ipInput.value,
      savedResults: resultsHtml || results.innerHTML
    });
  }

  // 加载保存的数据函数
  function loadSavedData() {
    chrome.storage.local.get(['savedIPs', 'savedResults'], (data) => {
      if (data.savedIPs) {
        ipInput.value = data.savedIPs;
      }
      if (data.savedResults) {
        results.innerHTML = data.savedResults;
      }
    });
  }
}); 