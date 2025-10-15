function KeysOverlay(utils, theme) {
    const keys = [
        'c', 'w', 'r', ' ', 'shift',
        'a', 's', 'd', 'mouseleft', 'mouseright'
    ];
    const keyLabels = {
        'w': 'W',
        'a': 'A',
        's': 'S',
        'd': 'D',
        'r': 'R',
        ' ': '␣',
        'shift': '🠭',
        'c': 'C',
        'mouseleft': 'LMB',
        'mouseright': 'RMB'
    };
    const keyColors = {
        'w': theme.red1,
        'a': theme.red1,
        's': theme.red1,
        'd': theme.red1,
        'r': theme.red2,
        ' ': theme.red2,
        'shift': theme.red2,
        'c': theme.red2,
        'mouseleft': theme.red2,
        'mouseright': theme.red2
    };

    const styleKeys = `
    #keyDisplayOverlay {
        position: fixed;
        top: 150px;
        left: 20px;
        display: grid;
        grid-template-columns: repeat(5, 50px);
        gap: 10px;
        background: rgba(0, 0, 0, 0.4);
        padding: 12px;
        border-radius: 10px;
        border: 3px solid #${theme.red1};
        z-index: 99999;
        cursor: move;
    }
    .keyDisplay {
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid;
        border-radius: 6px;
        font-size: 16px;
        font-weight: bold;
        color: ${theme.text1};
        background-color: transparent;
        transition: background-color 0.15s, transform 0.15s, box-shadow 0.15s;
        user-select: none;
    }
    .keyDisplay.pressed {
        transform: scale(1.1);
        box-shadow: 0 0 12px white;
    }`;
    utils.injectStyle(styleKeys);

    const keyContainer = utils.el('div', {
        id: 'keyDisplayOverlay'
    });
    document.body.appendChild(keyContainer);

    const keyElements = {};
    keys.forEach(k => {
        const lower = k.toLowerCase();
        const d = utils.el('div', {
            cls: 'keyDisplay',
            text: keyLabels[lower] || lower.toUpperCase()
        });
        d.style.borderColor = keyColors[lower] || '#fff';
        keyContainer.appendChild(d);
        keyElements[lower] = {
            el: d,
            color: keyColors[lower] || theme.red2
        };
    });

    function handleKey(action, key) {
        const entry = keyElements[key];
        if (!entry) return;
        const {
            el: e,
            color
        } = entry;
        if (action === 'down') {
            e.classList.add('pressed');
            e.style.backgroundColor = color;
        } else {
            e.classList.remove('pressed');
            e.style.backgroundColor = 'transparent';
        }
    }

    window.addEventListener('keydown', (ev) => {
        const k = ev.key.toLowerCase();
        if (k === ' ') handleKey('down', ' ');
        else if (k === 'shift') handleKey('down', 'shift');
        else handleKey('down', k);
    });
    window.addEventListener('keyup', (ev) => {
        const k = ev.key.toLowerCase();
        if (k === ' ') handleKey('up', ' ');
        else if (k === 'shift') handleKey('up', 'shift');
        else handleKey('up', k);
    });

    window.addEventListener('mousedown', (e) => {
        if (e.button === 0) handleKey('down', 'mouseleft');
        if (e.button === 2) handleKey('down', 'mouseright');
    });
    window.addEventListener('mouseup', (e) => {
        if (e.button === 0) handleKey('up', 'mouseleft');
        if (e.button === 2) handleKey('up', 'mouseright');
    });

    utils.makeDraggable(keyContainer, {
        storageKey: 'keyDisplayOverlay'
    });

}

module.exports = { KeysOverlay };