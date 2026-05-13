(function() {
  if (!document.cookie.split(';').some(function(c){ return c.trim() === 'horde_dev_panel=1'; })) return;

  var BASE = 'https://webmail-dev-03.u-picardie.fr/themes/horde/upjv/';
  var CDN  = 'https://cdn.u-picardie.fr/ds-upjv/styles/main.css';

  var THEMES = {
    'upjv':  [CDN, BASE + 'tokens.css'],
    'horde': [BASE + 'tokens-horde-default.css', BASE + 'reset-horde-default.css', BASE + 'tokens.css']
  };

  var curTheme = localStorage.getItem('horde_dev_theme') || 'horde';
  var curMode  = localStorage.getItem('horde_dev_mode')  || 'auto';

  function applyTheme(theme) {
    document.querySelectorAll('link[data-dev-theme]').forEach(function(l){ l.remove(); });
    THEMES[theme].forEach(function(url) {
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = url; l.setAttribute('data-dev-theme', '1');
      document.head.appendChild(l);
    });
  }

  function applyMode(mode) {
    var h = document.documentElement;
    h.classList.remove('theme-light', 'theme-dark');
    if (mode === 'light') h.classList.add('theme-light');
    if (mode === 'dark')  h.classList.add('theme-dark');
  }

  applyTheme(curTheme);
  applyMode(curMode);

  document.addEventListener('DOMContentLoaded', function() {
    var panel = document.createElement('div');
    panel.id = 'horde-dev-panel';
    panel.innerHTML = '<span style="font-weight:600;font-size:11px;letter-spacing:.05em;opacity:.7">DEV</span>'
      + '<select id="dev-theme-select">'
      + '<option value="horde"' + (curTheme==='horde'?' selected':'') + '>Horde Default</option>'
      + '<option value="upjv"'  + (curTheme==='upjv' ?' selected':'') + '>UPJV</option>'
      + '</select>'
      + '<select id="dev-mode-select">'
      + '<option value="auto"' + (curMode==='auto' ?' selected':'') + '>Auto</option>'
      + '<option value="light"'+ (curMode==='light'?' selected':'') + '>Light</option>'
      + '<option value="dark"' + (curMode==='dark' ?' selected':'') + '>Dark</option>'
      + '</select>';

    Object.assign(panel.style, {
      position:'fixed', bottom:'16px', right:'16px', zIndex:'99999',
      display:'flex', alignItems:'center', gap:'8px',
      background:'oklch(0.2 0.02 240 / 0.92)', backdropFilter:'blur(8px)',
      color:'#fff', padding:'8px 12px', borderRadius:'8px',
      fontSize:'12px', fontFamily:'system-ui, sans-serif',
      boxShadow:'0 4px 16px rgba(0,0,0,0.4)'
    });

    document.body.appendChild(panel);

    var selStyle = {
      background:'oklch(0.3 0.02 240)', color:'#fff',
      border:'1px solid oklch(0.5 0.02 240)', borderRadius:'4px',
      padding:'3px 6px', fontSize:'12px', cursor:'pointer'
    };
    var tSel = document.getElementById('dev-theme-select');
    var mSel = document.getElementById('dev-mode-select');
    Object.assign(tSel.style, selStyle);
    Object.assign(mSel.style, selStyle);

    tSel.addEventListener('change', function() {
      localStorage.setItem('horde_dev_theme', this.value);
      applyTheme(this.value);
    });
    mSel.addEventListener('change', function() {
      localStorage.setItem('horde_dev_mode', this.value);
      applyMode(this.value);
    });
  });
})();
