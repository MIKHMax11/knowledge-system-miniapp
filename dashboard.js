// ============================================
// Knowledge System - Telegram Mini App
// Взаимодействие через Telegram WebApp
// ============================================

// === ИНИЦИАЛИЗАЦИЯ ===

// Получаем объект Telegram WebApp
const tg = window.Telegram?.WebApp;

// Проверяем, запущено ли приложение в Telegram
const isTelegram = typeof tg !== 'undefined' && tg;

let currentPage = 1;
let agentInterval = null;
let isInitialized = false;

// Инициализация Mini App
if (isTelegram) {
    tg.ready();
    tg.expand(); // Разворачиваем на весь экран
    
    // Получаем данные пользователя
    const user = tg.initDataUnsafe?.user || { first_name: 'Гость' };
    document.getElementById('user-name').textContent = `👤 ${user.first_name}`;
    
    // Показываем статус подключения
    document.getElementById('agent-status').textContent = '🟢 Подключено к боту';
    
    console.log('👤 Пользователь:', user.first_name);
    console.log('✅ Mini App инициализирован');
    console.log('📱 Отправка данных в бот через WebApp.sendData()');
    
    // === СЛУШАЕМ ОТВЕТЫ ОТ БОТА ===
    tg.onEvent('message', function(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('📩 Ответ от бота:', data);
            handleBotResponse(data);
        } catch (e) {
            console.error('Ошибка парсинга ответа:', e);
        }
    });
    
    // Обработка закрытия
    tg.onEvent('close', function() {
        console.log('🔄 Приложение закрыто');
        if (agentInterval) {
            clearInterval(agentInterval);
        }
    });
    
} else {
    console.log('ℹ️ Запущено в браузере (не в Telegram)');
    document.getElementById('user-name').textContent = '👤 Тестовый режим';
    document.getElementById('agent-status').textContent = '⚠️ Тестовый режим';
}

// === ОТПРАВКА ДАННЫХ В БОТ ===

function sendToBot(action, data = {}) {
    if (!isTelegram) {
        console.log('📨 [Mock] Отправка в бот:', { action, data });
        return;
    }
    
    try {
        const message = JSON.stringify({
            action: action,
            data: data,
            user_id: tg.initDataUnsafe?.user?.id || 'guest',
            timestamp: Date.now()
        });
        
        console.log('📨 Отправка в бот:', action, data);
        tg.sendData(message);
        
    } catch (error) {
        console.error('❌ Ошибка отправки:', error);
        showMessage('add-message', '❌ Ошибка связи с ботом', 'error');
    }
}

// === ОБРАБОТКА ОТВЕТОВ ОТ БОТА ===

function handleBotResponse(response) {
    console.log('📩 Обработка ответа:', response);
    
    switch(response.action) {
        case 'knowledge_list':
            displayKnowledge(response.data?.items || []);
            break;
        case 'stats':
            updateStats(response.data || {});
            break;
        case 'answer':
            showAnswer(response.data || {});
            break;
        case 'search_result':
            displayKnowledge(response.data?.results || []);
            break;
        case 'add_result':
            if (response.data?.success) {
                showMessage('add-message', '✅ Добавлено успешно!', 'success');
                loadKnowledge();
                refreshStats();
            } else {
                showMessage('add-message', '❌ ' + (response.data?.message || 'Ошибка добавления'), 'error');
            }
            break;
        case 'generate_result':
            if (response.data?.success) {
                showMessage('add-message', '✅ Сгенерировано: ' + response.data?.topic, 'success');
                loadKnowledge();
                refreshStats();
            } else {
                showMessage('add-message', '❌ Ошибка генерации', 'error');
            }
            break;
        case 'error':
            showMessage('add-message', '❌ ' + (response.data?.message || 'Неизвестная ошибка'), 'error');
            break;
        default:
            console.log('Неизвестный ответ:', response);
    }
}

// === ЗАГРУЗКА ДАННЫХ ПРИ ОТКРЫТИИ ===

function loadInitialData() {
    console.log('🔄 Загрузка начальных данных...');
    
    // Показываем статус загрузки
    document.getElementById('agent-status').textContent = '🔄 Загрузка данных...';
    
    // Запрашиваем статистику
    sendToBot('get_stats');
    
    // Запрашиваем список знаний
    sendToBot('get_knowledge', { page: 1, limit: 20 });
    
    // Через 2 секунды обновляем статус
    setTimeout(() => {
        document.getElementById('agent-status').textContent = '🟢 Подключено к боту';
    }, 2000);
}

// === API ВЫЗОВЫ (через бота) ===

// Добавление знаний
function addKnowledge() {
    const title = document.getElementById('knowledge-title').value.trim();
    const content = document.getElementById('knowledge-content').value.trim();
    const category = document.getElementById('knowledge-category').value;
    
    if (!title || !content) {
        showMessage('add-message', '❌ Заполните все поля', 'error');
        return;
    }
    
    showMessage('add-message', '⏳ Отправка...', 'success');
    sendToBot('add_knowledge', {
        title: title,
        content: content,
        category: category
    });
    
    document.getElementById('knowledge-title').value = '';
    document.getElementById('knowledge-content').value = '';
}

// Загрузка файла
function uploadFile() {
    const fileInput = document.getElementById('knowledge-file');
    const category = document.getElementById('file-category').value;
    
    if (!fileInput.files.length) {
        showMessage('add-message', '❌ Выберите файл', 'error');
        return;
    }
    
    showMessage('add-message', '⏳ Отправка файла...', 'success');
    sendToBot('upload_file', {
        filename: fileInput.files[0].name,
        category: category,
        size: fileInput.files[0].size
    });
}

// Генерация материала
function generateMaterial() {
    const topic = document.getElementById('generate-topic').value.trim();
    const level = document.getElementById('generate-level').value;
    
    if (!topic) {
        showMessage('add-message', '❌ Укажите тему', 'error');
        return;
    }
    
    showMessage('add-message', '⏳ Генерация...', 'success');
    sendToBot('generate', {
        topic: topic,
        level: level
    });
    
    document.getElementById('generate-topic').value = '';
}

// Загрузка списка знаний
function loadKnowledge(page = 1) {
    currentPage = page;
    const list = document.getElementById('knowledge-list');
    list.innerHTML = '<div class="loading show"><div class="spinner"></div>Загрузка...</div>';
    sendToBot('get_knowledge', { page: page, limit: 20 });
}

// Отображение знаний
function displayKnowledge(items) {
    const list = document.getElementById('knowledge-list');
    list.innerHTML = '';
    
    if (!items || items.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#a0a0a0;padding:20px;">📭 Нет элементов</p>';
        return;
    }
    
    items.forEach(item => {
        const badge = item.is_studied ? 
            '<span class="knowledge-item-badge studied">✅ Изучено</span>' :
            '<span class="knowledge-item-badge">⏳ В очереди</span>';
        
        const date = new Date(item.created_at).toLocaleDateString('ru-RU');
        const category = item.category || 'general';
        
        const html = `
            <div class="knowledge-item">
                <div class="knowledge-item-info">
                    <div class="knowledge-item-title">${escapeHtml(item.title)}</div>
                    <div class="knowledge-item-meta">
                        📁 ${escapeHtml(category)} • 📅 ${date}
                    </div>
                </div>
                ${badge}
                <button class="btn-danger" onclick="deleteKnowledge(${item.id})">✕</button>
            </div>
        `;
        list.innerHTML += html;
    });
}

// Удаление
function deleteKnowledge(id) {
    if (!confirm('Удалить этот элемент?')) return;
    sendToBot('delete_knowledge', { id: id });
    loadKnowledge();
    refreshStats();
}

// Загрузить ещё
function loadMoreKnowledge() {
    loadKnowledge(currentPage + 1);
}

// Поиск
function searchKnowledge() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) {
        loadKnowledge();
        return;
    }
    sendToBot('search', { query: query });
}

// Статистика
function refreshStats() {
    sendToBot('get_stats');
}

function updateStats(stats) {
    document.getElementById('stat-total').textContent = stats.total_items || 0;
    document.getElementById('stat-studied').textContent = stats.studied || 0;
    document.getElementById('stat-level').textContent = Math.round(stats.level || 0) + '%';
    document.getElementById('stat-unstudied').textContent = stats.pending || 0;
    updateAgentStatus(stats.agent);
}

// Управление агентом
function startAgent() {
    sendToBot('agent_start');
    showMessage('add-message', '⏳ Запуск агента...', 'success');
}

function stopAgent() {
    sendToBot('agent_stop');
    showMessage('add-message', '⏳ Остановка агента...', 'success');
}

function updateAgentStatus(agentStatus) {
    const statusEl = document.getElementById('agent-status');
    if (!statusEl) return;
    
    if (agentStatus && agentStatus.is_running) {
        statusEl.textContent = '🟢 Агент активен • ' + Math.round(agentStatus.knowledge_level || 0) + '%';
    } else {
        statusEl.textContent = '🔴 Агент неактивен';
    }
}

// AI Ассистент
function askQuestion() {
    const question = document.getElementById('question').value.trim();
    if (!question) {
        alert('Напишите вопрос');
        return;
    }
    
    const container = document.getElementById('answer-container');
    const textEl = document.getElementById('answer-text');
    const sourcesEl = document.getElementById('answer-sources');
    
    textEl.textContent = '⏳ Ожидание ответа от бота...';
    sourcesEl.textContent = '';
    container.style.display = 'block';
    
    sendToBot('ask', { question: question });
}

function showAnswer(data) {
    const textEl = document.getElementById('answer-text');
    const sourcesEl = document.getElementById('answer-sources');
    
    textEl.textContent = data.answer || 'Нет ответа от бота';
    sourcesEl.textContent = '📚 Найдено релевантных источников: ' + (data.sources || 0);
}

// Экспорт
function exportKnowledge() {
    sendToBot('export');
    showMessage('add-message', '⏳ Экспорт...', 'success');
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function showMessage(elementId, text, type) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    el.textContent = text;
    el.className = 'message ' + type;
    
    if (type === 'success') {
        setTimeout(() => {
            el.className = 'message';
        }, 4000);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// === ИНИЦИАЛИЗАЦИЯ ===

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM загружен, инициализация...');
    
    // Настройка вкладок
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(el => {
                el.classList.remove('active');
            });
            document.querySelectorAll('.tab-button').forEach(el => {
                el.classList.remove('active');
            });
            const tabContent = document.getElementById('tab-' + tabName);
            if (tabContent) tabContent.classList.add('active');
            this.classList.add('active');
        });
    });
    
    // Enter для поиска
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchKnowledge();
            }
        });
    }
    
    // Enter + Shift для вопроса
    const questionInput = document.getElementById('question');
    if (questionInput) {
        questionInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && e.shiftKey) {
                askQuestion();
            }
        });
    }
    
    // === ЗАГРУЗКА ДАННЫХ ===
    // Ждём 1 секунду перед загрузкой для инициализации
    setTimeout(function() {
        console.log('🔄 Загрузка начальных данных...');
        
        // Проверяем, что мы в Telegram
        if (isTelegram) {
            // Запрашиваем статистику
            sendToBot('get_stats');
            // Запрашиваем список знаний
            sendToBot('get_knowledge', { page: 1, limit: 20 });
        } else {
            // В браузере используем мок-данные
            console.log('ℹ️ Используем тестовые данные');
            setTimeout(function() {
                updateStats({
                    total_items: 742,
                    studied: 497,
                    level: 49.6,
                    pending: 245,
                    agent: { is_running: true, knowledge_level: 49.6 }
                });
                displayKnowledge([
                    { id: 1, title: 'Психология личности', category: 'psychology', is_studied: true, created_at: Date.now() },
                    { id: 2, title: 'Нейронные сети', category: 'ai', is_studied: false, created_at: Date.now() },
                    { id: 3, title: 'Основы Python', category: 'programming', is_studied: true, created_at: Date.now() }
                ]);
                document.getElementById('agent-status').textContent = '⚠️ Тестовый режим';
            }, 500);
        }
    }, 1000);
    
    // Обновление статистики каждые 10 секунд
    if (isTelegram) {
        agentInterval = setInterval(function() {
            console.log('🔄 Автообновление статистики...');
            sendToBot('get_stats');
        }, 10000);
    }
    
    console.log('✅ Knowledge System Mini App загружен');
});

// Очистка интервала при закрытии
window.addEventListener('beforeunload', function() {
    if (agentInterval) {
        clearInterval(agentInterval);
    }
});