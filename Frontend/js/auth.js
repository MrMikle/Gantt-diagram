// Получаем элементы
const authModal = document.getElementById('authModal');
const closeAuthBtn = document.getElementById('closeAuth');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const openAuthBtn = document.getElementById('openAuth');

// Функция открытия модалки
function openAuthModal() {
    authModal.classList.remove('hidden');
}

// Функция закрытия модалки
function closeAuthModal() {
    authModal.classList.add('hidden');
}

openAuthBtn.addEventListener('click', () => {
  authModal.classList.remove('hidden');
});

closeAuthBtn.addEventListener('click', () => {
  authModal.classList.add('hidden');
});

// Переключение табов
function showLogin() {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
}

function showRegister() {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
}

// Слушатели
closeAuthBtn.addEventListener('click', closeAuthModal);
loginTab.addEventListener('click', showLogin);
registerTab.addEventListener('click', showRegister);

// Пример глобальной кнопки открытия модалки
// <button id="openAuthBtn">Авторизация</button>
if (openAuthBtn) {
    openAuthBtn.addEventListener('click', openAuthModal);
}

// Закрытие по клику на фон
authModal.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
});

function updateAuthButton() {
    if (currentUser) {
        openAuth.textContent = currentUser;   // показываем имя
        openAuth.disabled = true;             // делаем неактивной (по желанию)
        openAuth.classList.add("ghost");      // стилизуем иначе (по желанию)
    } else {
        openAuth.textContent = "Войти";
        openAuth.disabled = false;
        openAuth.classList.remove("ghost");
    }
}

openAuth.onclick = () => {
    authModal.classList.remove("hidden");
};

loginForm.onsubmit = (e) => {
    e.preventDefault();

    const user = loginUser.value.trim();
    const pass = loginPass.value.trim();

    if (!user || !pass) return;

    // тут ваша логика проверки пароля
    // например: if (user === "test" && pass === "123")

    currentUser = user;          // <-- сохраняем имя пользователя
    updateAuthButton();          // <-- меняем кнопку в header
    authModal.classList.add("hidden");  // закрываем окно
};

registerForm.onsubmit = (e) => {
    e.preventDefault();

    const user = regUser.value.trim();
    const pass = regPass.value.trim();

    if (!user || !pass) return;

    // логика создания аккаунта

    currentUser = user;       // сразу логиним
    updateAuthButton();       
    authModal.classList.add("hidden");
};

closeAuth.onclick = () => {
    authModal.classList.add("hidden");
};