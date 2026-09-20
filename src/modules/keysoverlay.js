function KeysOverlay(utils, theme) {
    const keys = [
        'f', 'w', 'r', ' ', 'shift',
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
        'f': 'F',
        'mouseleft': 'LMB',
        'mouseright': 'RMB'
    };

    const RED1 = 'var(--ov-red1, #8da4ff)';
    const RED2 = 'var(--ov-red2, #8da4ff)';
    const keyColors = {
        'w': RED1,
        'a': RED1,
        's': RED1,
        'd': RED1,
        'r': RED2,
        ' ': RED2,
        'shift': RED2,
        'f': RED2,
        'mouseleft': RED2,
        'mouseright': RED2
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
        border: 3px solid ${RED1};
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
        color: var(--ov-text2, #fff);
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
            color: keyColors[lower] || RED2
        };
    });

    function handleKey(action, key) {
        const entry = keyElements[key];
        if (!entry) return;
        const { el: e, color } = entry;
        if (action === 'down') {
            e.classList.add('pressed');
            e.style.backgroundColor = color;   
        } else {
            e.classList.remove('pressed');
            e.style.backgroundColor = 'transparent';
        }
    }

    window.addEventListener('keydown', (ev) => handleKey('down', ev.key.toLowerCase()));
    window.addEventListener('keyup', (ev) => handleKey('up', ev.key.toLowerCase()));

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