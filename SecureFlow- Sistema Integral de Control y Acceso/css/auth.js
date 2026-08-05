/**
 * SecureFlow ADSO - Auth Module
 * Maneja autenticación, registro y gestión de sesión
 */

const API_BASE = 'http://localhost:5000/api';

// ======================================================
= TOKEN MANAGEMENT
// ======================================================

const TokenManager = {
    getToken() {
        return localStorage.getItem('secureflow_token');
    },
    
    setToken(token) {
        localStorage.setItem('secureflow_token', token);
    },
    
    removeToken() {
        localStorage.removeItem('secureflow_token');
    },
    
    getUser() {
        try {
            const user = localStorage.getItem('secureflow_user');
            return user ? JSON.parse(user) : null;
        } catch {
            return null;
        }
    },
    
    setUser(user) {
        localStorage.setItem('secureflow_user', JSON.stringify(user));
    },
    
    removeUser() {
        localStorage.removeItem('secureflow_user');
    },
    
    clearSession() {
        this.removeToken();
        this.removeUser();
    }
};

// ======================================================
= UTILITY FUNCTIONS
// ======================================================

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('visible');
    }
}

function clearError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = '';
        element.classList.remove('visible');
    }
}

function showAlert(message, type = 'info', containerId = 'alertContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    alert.innerHTML = `
        <i class="fas ${icons[type] || icons.info}" aria-hidden="true"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(alert);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

function clearAlerts(containerId = 'alertContainer') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
    }
}

function showLoading(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Cargando...`;
}

function hideLoading(buttonId, originalText) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    
    btn.disabled = false;
    btn.innerHTML = originalText || 'Enviar';
}

// ======================================================
= AUTH FUNCTIONS
// ======================================================

async function handleLogin(email, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al iniciar sesión');
        }
        
        // Guardar token y usuario
        TokenManager.setToken(data.token);
        TokenManager.setUser(data.user);
        
        // Verificar token (iniciar timeout por inactividad)
        startInactivityTimer();
        
        return { success: true, user: data.user };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function handleRegister(userData) {
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al registrar usuario');
        }
        
        return { success: true, data };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function handleLogout() {
    const token = TokenManager.getToken();
    
    if (token) {
        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error en logout:', error);
        }
    }
    
    TokenManager.clearSession();
    clearInactivityTimer();
    window.location.href = '/pages/login.html';
}

async function verifySession() {
    const token = TokenManager.getToken();
    if (!token) return false;
    
    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            TokenManager.setUser(data.user);
            startInactivityTimer();
            return true;
        }
        
        // Token inválido o expirado
        TokenManager.clearSession();
        clearInactivityTimer();
        return false;
        
    } catch (error) {
        console.error('Error verificando sesión:', error);
        return false;
    }
}

// ======================================================
= INACTIVITY TIMER
// ======================================================

let inactivityTimer = null;
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos

function startInactivityTimer() {
    clearInactivityTimer();
    
    inactivityTimer = setTimeout(() => {
        // Mostrar alerta y cerrar sesión
        showSessionTimeoutAlert();
        handleLogout();
    }, INACTIVITY_TIMEOUT);
}

function clearInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
}

function resetInactivityTimer() {
    if (TokenManager.getToken()) {
        clearInactivityTimer();
        startInactivityTimer();
    }
}

function showSessionTimeoutAlert() {
    // Crear alerta de tiempo expirado
    const alertDiv = document.createElement('div');
    alertDiv.className = 'session-timeout-overlay';
    alertDiv.innerHTML = `
        <div class="session-timeout-modal">
            <i class="fas fa-clock" aria-hidden="true"></i>
            <h2>Sesión Expirada</h2>
            <p>Tu sesión ha expirado por inactividad. Serás redirigido al inicio de sesión.</p>
        </div>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Eventos para resetear el timer
document.addEventListener('click', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
document.addEventListener('scroll', resetInactivityTimer);
document.addEventListener('mousemove', resetInactivityTimer);

// ======================================================
= FORM HANDLERS
// ======================================================

// --- LOGIN FORM ---
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearAlerts('loginAlertContainer');
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            // Validaciones frontend
            let valid = true;
            
            if (!email) {
                showError('emailError', 'El correo electrónico es requerido');
                valid = false;
            } else if (!isValidEmail(email)) {
                showError('emailError', 'Ingresa un correo electrónico válido');
                valid = false;
            } else {
                clearError('emailError');
            }
            
            if (!password) {
                showError('passwordError', 'La contraseña es requerida');
                valid = false;
            } else {
                clearError('passwordError');
            }
            
            if (!valid) return;
            
            // Mostrar loading
            showLoading('loginBtn', 'Iniciando sesión...');
            
            const result = await handleLogin(email, password);
            
            hideLoading('loginBtn', 'Iniciar Sesión');
            
            if (result.success) {
                // Redirigir según rol
                const user = result.user;
                if (user.rol === 'admin') {
                    window.location.href = '/pages/dashboard.html';
                } else {
                    window.location.href = '/pages/dashboard.html';
                }
            } else {
                showAlert(result.error, 'error', 'loginAlertContainer');
            }
        });
    }
    
    // --- REGISTER FORM ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearAlerts('registerAlertContainer');
            
            const nombre = document.getElementById('nombre').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validaciones frontend
            let valid = true;
            
            if (!nombre) {
                showError('nombreError', 'El nombre es requerido');
                valid = false;
            } else if (nombre.length < 2) {
                showError('nombreError', 'El nombre debe tener al menos 2 caracteres');
                valid = false;
            } else {
                clearError('nombreError');
            }
            
            if (!email) {
                showError('emailError', 'El correo electrónico es requerido');
                valid = false;
            } else if (!isValidEmail(email)) {
                showError('emailError', 'Ingresa un correo electrónico válido');
                valid = false;
            } else {
                clearError('emailError');
            }
            
            if (!password) {
                showError('passwordError', 'La contraseña es requerida');
                valid = false;
            } else if (!isValidPassword(password)) {
                showError('passwordError', 'La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial');
                valid = false;
            } else {
                clearError('passwordError');
            }
            
            if (!confirmPassword) {
                showError('confirmError', 'Confirma tu contraseña');
                valid = false;
            } else if (password !== confirmPassword) {
                showError('confirmError', 'Las contraseñas no coinciden');
                valid = false;
            } else {
                clearError('confirmError');
            }
            
            if (!valid) return;
            
            showLoading('registerBtn', 'Registrando...');
            
            const result = await handleRegister({
                nombre,
                email,
                password,
                confirmPassword
            });
            
            hideLoading('registerBtn', 'Registrarse');
            
            if (result.success) {
                showAlert('Registro exitoso. Ya puedes iniciar sesión.', 'success', 'registerAlertContainer');
                registerForm.reset();
                setTimeout(() => {
                    window.location.href = '/pages/login.html';
                }, 2000);
            } else {
                showAlert(result.error, 'error', 'registerAlertContainer');
            }
        });
    }
    
    // --- TOGGLE PASSWORD VISIBILITY ---
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            if (input) {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                this.querySelector('i').classList.toggle('fa-eye');
                this.querySelector('i').classList.toggle('fa-eye-slash');
            }
        });
    });
    
    // --- LOGOUT BUTTON ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
    
    // --- VERIFICAR SESIÓN EN PÁGINAS PROTEGIDAS ---
    const protectedPages = ['/pages/dashboard.html', '/pages/profile.html', 
                           '/pages/admin-users.html', '/pages/admin-logs.html',
                           '/pages/user-tasks.html'];
    const currentPath = window.location.pathname;
    
    if (protectedPages.some(page => currentPath.endsWith(page))) {
        (async function() {
            const isValid = await verifySession();
            if (!isValid) {
                window.location.href = '/pages/login.html';
            }
        })();
    }
});

// ======================================================
= VALIDATION HELPERS
// ======================================================

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidPassword(password) {
    // Mínimo 8 caracteres, mayúscula, minúscula, número, carácter especial
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    return re.test(password);
}

// ======================================================
= EXPOSED API
// ======================================================

// Exponer funciones para uso en otras páginas
window.SecureFlow = {
    TokenManager,
    handleLogin,
    handleRegister,
    handleLogout,
    verifySession,
    showAlert,
    showLoading,
    hideLoading,
    isValidEmail,
    isValidPassword
};