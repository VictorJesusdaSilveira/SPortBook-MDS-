const DB_KEY = 'sportbook_db_v1';

const defaultDB = {
    users: [
        {
            id: 1,
            nome: 'Maria Souza',
            email: 'maria@email.com',
            senha: '1234'
        },
        {
            id: 2,
            nome: 'João Silva',
            email: 'joao@email.com',
            senha: '1234'
        }
    ],

    admins: [
        {
            id: 1,
            nome: 'Administrador',
            email: 'admin@sportbook.com',
            senha: 'admin123'
        }
    ],

    quadras: [
        {
            id: 1,
            nome: 'Quadra 1',
            tipo: 'Poliesportiva',
            ativa: true
        },
        {
            id: 2,
            nome: 'Quadra 2',
            tipo: 'Society',
            ativa: true
        }
    ],

    blocked: [],

    reservations: [
        {
            id: 1,
            userId: 1,
            userNome: 'Maria Souza',
            quadraId: 1,
            data: '2026-10-07',
            inicio: '18:00',
            fim: '20:00',
            status: 'confirmed'
        }
    ],

    nextId: 10
};


// ===============================
// BANCO LOCAL
// ===============================

function getDB() {

    const raw = localStorage.getItem(DB_KEY);

    if (!raw) {

        saveDB(defaultDB);

        return structuredClone(defaultDB);
    }

    return JSON.parse(raw);
}


function saveDB(db) {

    localStorage.setItem(
        DB_KEY,
        JSON.stringify(db)
    );
}


// ===============================
// SESSÃO
// ===============================

function currentUser() {

    const raw =
        localStorage.getItem('sportbook_session');

    return raw ? JSON.parse(raw) : null;
}


function setSession(obj) {

    localStorage.setItem(
        'sportbook_session',
        JSON.stringify(obj)
    );
}


function logout() {

    localStorage.removeItem(
        'sportbook_session'
    );

    location.href = '../index.html';
}


// ===============================
// SEGURANÇA / FORMATAÇÃO
// ===============================

function esc(s) {

    return String(s ?? '').replace(
        /[&<>"']/g,

        function (m) {

            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'

            }[m];
        }
    );
}


function toast(msg) {

    const el =
        document.getElementById('toast');

    if (!el) return;

    el.textContent = msg;

    el.classList.add('show');

    setTimeout(
        () => el.classList.remove('show'),
        2600
    );
}


// ===============================
// AUTENTICAÇÃO
// ===============================

function requireSession(role) {

    const s = currentUser();

    if (!s || s.role !== role) {

        location.href =
            role === 'admin'
                ? 'login.html'
                : 'login.html';

        return null;
    }

    return s;
}


// ===============================
// DATAS / HORÁRIOS
// ===============================

function dateBR(d) {

    if (!d) return '';

    const [y, m, day] =
        d.split('-');

    return `${day}/${m}/${y}`;
}


function todayISO() {

    return new Date()
        .toISOString()
        .slice(0, 10);
}


function timeToMin(t) {

    const [h, m] =
        t.split(':').map(Number);

    return h * 60 + m;
}


function minToTime(v) {

    return String(
        Math.floor(v / 60)
    ).padStart(2, '0')
        + ':' +
        String(v % 60).padStart(2, '0');
}


function hours(start, end) {

    return (
        timeToMin(end) -
        timeToMin(start)
    ) / 60;
}


// ===============================
// CONFLITOS
// ===============================

function isConflict(
    db,
    qid,
    date,
    start,
    end,
    ignoreId = null
) {

    return db.reservations.some(r =>

        r.quadraId == qid &&

        r.data === date &&

        r.status === 'confirmed' &&

        r.id != ignoreId &&

        timeToMin(start) <
        timeToMin(r.fim) &&

        timeToMin(end) >
        timeToMin(r.inicio)
    );
}


function isBlocked(
    db,
    qid,
    date,
    start,
    end
) {

    return db.blocked.some(r =>

        r.quadraId == qid &&

        r.data === date &&

        timeToMin(start) <
        timeToMin(r.fim) &&

        timeToMin(end) >
        timeToMin(r.inicio)
    );
}


// ===============================
// CABEÇALHO
// ===============================

function initHeader(role) {

    const s = currentUser();

    const name =
        s?.nome || 'Visitante';

    const el =
        document.getElementById(
            'sessionName'
        );

    if (el)
        el.textContent = name;


    const av =
        document.getElementById(
            'avatar'
        );

    if (av)
        av.textContent =
            name.charAt(0).toUpperCase();


    const logoutEl =
        document.getElementById(
            'logout'
        );

    if (logoutEl)
        logoutEl.onclick = logout;


    // Menu do perfil
    const profileButton =
        document.getElementById(
            'profileButton'
        );

    const profileMenu =
        document.getElementById(
            'profileMenu'
        );

    if (profileButton && profileMenu) {

        profileButton.onclick = function () {

            profileMenu.classList.toggle(
                'open'
            );
        };
    }
}


// ===============================
// MENU
// ===============================

function makeNav(role, active) {

    const links =
        role === 'admin'

            ? [

                ['inicio.html', 'Painel'],

                ['usuarios.html', 'Usuários'],

                ['reservas.html', 'Reservas'],

                ['quadras.html', 'Quadras'],

                ['horarios.html', 'Horários']

            ]

            : [

                ['nova-reserva.html', 'Reservar'],

                ['minhas-reservas.html', 'Minhas reservas'],

                ['regras.html', 'Regras de uso']

            ];


    return links.map(x =>

        `<a
            class="${active === x[0] ? 'active' : ''}"
            href="${x[0]}"
        >
            ${x[1]}
        </a>`

    ).join('');
}


// ===============================
// LAYOUT
// ===============================

function renderLayout(
    role,
    active,
    title,
    content
) {

    document.body.innerHTML = `

        <div class="app">

            <header class="topbar">

                <a
                    class="brand"
                    href="${role === 'admin'
                        ? 'inicio.html'
                        : 'nova-reserva.html'}"
                >

                    <img
                        src="../img/logo-sportbook.png"
                    >

                    <span>SPortBook</span>

                </a>


                <nav class="nav">

                    ${makeNav(
                        role,
                        active
                    )}

                </nav>


                <div class="user-area">

                    <div
                        class="profile-menu"
                        id="profileMenu"
                    >

                        <button
                            class="profile-button"
                            id="profileButton"
                        >

                            <div
                                class="avatar"
                                id="avatar"
                            >
                                U
                            </div>

                            <span
                                id="sessionName"
                            >
                            </span>

                            <span class="arrow">
                                ▾
                            </span>

                        </button>


                        <div
                            class="profile-dropdown"
                        >

                            ${
                                role === 'user'

                                ? `
                                <a href="perfil.html">
                                    Meu perfil
                                </a>
                                `

                                : ''
                            }


                            <button
                                id="logout"
                            >
                                Sair
                            </button>

                        </div>

                    </div>

                </div>

            </header>


            <main class="container">

                ${content}

            </main>


            <div
                id="toast"
                class="toast"
            >
            </div>

        </div>
    `;


    initHeader(role);
}