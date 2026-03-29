# VK Mini App — Печать этикеток

Версия приложения для VK Mini Apps.

## Установка

### 1. Создание приложения VK

1. Перейдите на https://vk.com/apps?act=manage
2. Нажмите **Создать приложение**
3. Выберите тип **VK Mini Apps**
4. Введите название (например: "Печать этикеток")
5. Сохраните `app_id`

### 2. Загрузка на хостинг

Загрузите папку `vk` на GitHub Pages или другой хостинг с HTTPS.

Если используете GitHub Pages:
1. Создайте новый репозиторий
2. Загрузите содержимое папки `vk`
3. Включите GitHub Pages в настройках

### 3. Настройка приложения

1. В настройках приложения VK укажите URL:
   ```
   https://ваш-username.github.io/vk-label-printer/
   ```

2. Добавьте разрешения:
   - `storage` — для сохранения настроек

### 4. Тестирование

Откройте приложение через:
```
https://vk.com/app{app_id}
```

Или в мобильном приложении VK.

## Структура

```
vk/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js          # Главная логика + VK Bridge
│   ├── storage.js      # VK Storage API
│   ├── barcode.js
│   └── pdf-generator.js
├── data/
│   └── templates.json
└── README.md
```

## Отличия от Telegram версии

- Используется VK Bridge вместо Telegram Web App SDK
- Темы адаптированы под VK (space_gray, vkcom_dark и др.)
- Хранилище через VKWebAppStorageSet/Get
