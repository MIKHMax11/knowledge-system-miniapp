// ============================================
// Knowledge System - Telegram Mini App
// Версия для GitHub Pages
// ============================================

console.log('🚀 Knowledge System Mini App загружается...');

// === ИНИЦИАЛИЗАЦИЯ ===

const tg = window.Telegram?.WebApp;
const isTelegram = typeof tg !== 'undefined' && tg;

let currentPage = 1;
let agentInterval = null;
let isInitialized = false;

// Ждём загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM загружен');
    
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
    
    // Enter для вопроса
    const questionInput = document.getElementById('question');
    if (questionInput) {
        questionInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && e.shiftKey) {
                askQuestion();
            }
        });
    }
    
    // Инициализация Telegram
    initTelegram();
});

function initTelegram() {
    console.log('🔄 Инициализация Telegram...');
    
    if (isTelegram) {
        tg.ready();
        tg.expand();
        
        const user = tg.initDataUnsafe?.user || { first_name: 'Гость' };
        document.getElementById('user-name').textContent = `👤 ${user.first_name}`;
        document.getElementById('agent-status').textContent = '🟢 Подключено к боту';
        
        console.log(`👤 Пользователь: ${user.first_name}`);
        console.log('✅ Mini App инициализирован');
        
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
        
        // Загрузка данных
        setTimeout(function() {
            console.log('🔄 Загрузка начальных данных...');
            loadData();
        }, 1000);
        
    } else {
        console.log('ℹ️ Запущено вне Telegram (тестовый режим)');
        document.getElementById('agent-status').textContent = '⚠️ Тестовый режим';
        document.getElementById('user-name').textContent = '👤 Тестовый режим';
        
        // Тестовые данные
        setTimeout(function() {
            console.log('🔄 Загрузка тестовых данных...');
            mockResponse('get_stats');
            mockResponse('get_knowledge');
        }, 500);
    }
    
    // Автообновление статистики
    if (isTelegram) {
        agentInterval = setInterval(function() {
            sendToBot('get_stats');
        }, 30000);
    }
}

// === ОТПРАВКА В БОТ ===

function sendToBot(action, data = {}) {
    console.log(`📨 Отправка: ${action}`, data);
    
    if (!isTelegram) {
        console.log(`📨 [Mock] ${action}`);
        setTimeout(() => {
            mockResponse(action);
        }, 300);
        return;
    }

    try {
        const message = JSON.stringify({
            action: action,
            data: data,
            user_id: tg.initDataUnsafe?.user?.id || 'guest',
            timestamp: Date.now()
        });
        tg.sendData(message);
        console.log(`📨 Отправлено: ${action}`);
    } catch (e) {
        console.error('❌ Ошибка отправки:', e);
        showMessage('add-message', '❌ Ошибка отправки', 'error');
    }
}

// === MOCK ОТВЕТЫ ===

function mockResponse(action) {
    console.log(`📩 [Mock] Ответ на ${action}`);
    
    const mockData = {
        'get_stats': {
            total_items: 742,
            studied: 497,
            level: 49.6,
            pending: 245,
            agent: { is_running: true, knowledge_level: 49.6 }
        },
        'get_knowledge': {
            items: [
                { id: 1, title: 'Психология личности', category: 'psychology', is_studied: true, created_at: Date.now() },
                { id: 2, title: 'Нейронные сети', category: 'ai', is_studied: false, created_at: Date.now() },
                { id: 3, title: 'Основы Python', category: 'programming', is_studied: true, created_at: Date.now() },
                { id: 4, title: 'История древнего Египта', category: 'history', is_studied: false, created_at: Date.now() },
                { id: 5, title: 'Квантовая физика', category: 'science', is_studied: true, created_at: Date.now() }
            ],
            total: 5
        },
        'ask': {
            answer: 'Это тестовый ответ. В реальности данные приходят от бота.\n\nМашинное обучение (ML) — это подмножество искусственного интеллекта, которое позволяет системам учиться и улучшаться на основе опыта без явного программирования.',
            sources: 3
        }
    };
    
    setTimeout(() => {
        handleBotResponse({
            action: action,
            data: mockData[action] || {}
        });
    }, 200);
}

// === ОБРАБОТКА ОТВЕТОВ ===

function handleBotResponse(response) {
    console.log('📩 Обработка ответа:', response);
    
    switch(response.action) {
        case 'stats':
            updateStats(response.data);
            break;
        case 'knowledge_list':
            displayKnowledge(response.data.items || []);
            break;
        case 'answer':
            showAnswer(response.data);
            break;
        case 'search_result':
            displayKnowledge(response.data.results || []);
            break;
        default:
            console.log('Неизвестный ответ:', response);
    }
}

// === ОБНОВЛЕНИЕ СТАТИСТИКИ ===

function updateStats(stats) {
    document.getElementById('stat-total').textContent = stats.total_items || 0;
    document.getElementById('stat-studied').textContent = stats.studied || 0;
    document.getElementById('stat-level').textContent = Math.round(stats.level || 0) + '%';
    document.getElementById('stat-unstudied').textContent = stats.pending || 0;
}

// === ОТОБРАЖЕНИЕ ЗНАНИЙ ===

function displayKnowledge(items) {
    const list = document.getElementById('knowledge-list');
    list.innerHTML = '';
    
    if (!items || items.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#a0a0a0;padding:30px;">📭 Нет элементов</p>';
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
                <button class="btn-danger" style="padding:6px 12px;font-size:0.8em;cursor:pointer;" onclick="deleteKnowledge(${item.id})">✕</button>
            </div>
        `;
        list.innerHTML += html;
    });
}

// === УДАЛЕНИЕ ===

function deleteKnowledge(id) {
    if (!confirm('Удалить этот элемент?')) return;
    sendToBot('delete_knowledge', { id: id });
    setTimeout(() => loadData(), 500);
}

// === ПОИСК ===

function searchKnowledge() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) {
        loadData();
        return;
    }
    sendToBot('search', { query: query });
}

// === ЗАГРУЗКА ДАННЫХ ===

function loadData() {
    console.log('🔄 Загрузка данных...');
    sendToBot('get_stats');
    sendToBot('get_knowledge', { page: 1, limit: 20 });
}

function refreshStats() {
    console.log('🔄 Обновление статистики...');
    sendToBot('get_stats');
}

function loadMoreKnowledge() {
    currentPage += 1;
    sendToBot('get_knowledge', { page: currentPage, limit: 20 });
}

// === ДОБАВЛЕНИЕ ЗНАНИЙ ===

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
    setTimeout(() => loadData(), 1000);
}

// === ГЕНЕРАЦИЯ ===

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
    setTimeout(() => loadData(), 2000);
}

// === ЗАГРУЗКА ФАЙЛА ===

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

// === AI АССИСТЕНТ ===

function askQuestion() {
    const question = document.getElementById('question').value.trim();
    if (!question) {
        alert('Напишите вопрос');
        return;
    }
    
    const container = document.getElementById('answer-container');
    const textEl = document.getElementById('answer-text');
    const sourcesEl = document.getElementById('answer-sources');
    
    textEl.textContent = '⏳ Ожидание ответа...';
    sourcesEl.textContent = '';
    container.style.display = 'block';
    
    sendToBot('ask', { question: question });
}

function showAnswer(data) {
    const textEl = document.getElementById('answer-text');
    const sourcesEl = document.getElementById('answer-sources');
    
    textEl.textContent = data.answer || 'Нет ответа';
    sourcesEl.textContent = '📚 Найдено релевантных источников: ' + (data.sources || 0);
}

// === ЭКСПОРТ ===

function exportKnowledge() {
    sendToBot('export');
    showMessage('add-message', '⏳ Экспорт...', 'success');
}

// === УПРАВЛЕНИЕ АГЕНТОМ ===

function startAgent() {
    sendToBot('agent_start');
    showMessage('add-message', '⏳ Запуск агента...', 'success');
}

function stopAgent() {
    sendToBot('agent_stop');
    showMessage('add-message', '⏳ Остановка агента...', 'success');
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function showMessage(elementId, text, type) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = text;
    el.className = 'message ' + type;
    if (type === 'success') {
        setTimeout(() => { el.className = 'message'; }, 4000);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// === ЗАКРЫТИЕ ===

window.addEventListener('beforeunload', function() {
    if (agentInterval) {
        clearInterval(agentInterval);
    }
});

console.log('✅ Knowledge System Mini App загружен');