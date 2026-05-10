import asyncio
import html
from aiogram import Bot, Dispatcher, Router, F
from aiogram.types import (
    Message, CallbackQuery,
    InlineKeyboardMarkup, InlineKeyboardButton,
    ReplyKeyboardMarkup, KeyboardButton,
)
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from groq import AsyncGroq

from config import TELEGRAM_BOT_TOKEN, GROQ_API_KEY, GROQ_MODEL
from prompts import PROMPTS, REFINE_PROMPT

router = Router()
groq_client = AsyncGroq(api_key=GROQ_API_KEY)

MENU_BUTTONS = {
    "📝 Написать пост": "post",
    "📧 Email-письмо": "email",
    "🖥 Описание курса": "course",
    "🎬 Сторис-сценарий": "stories",
    "💡 Заголовки": "headlines",
    "📊 Моя история": "story",
}


class BotState(StatesGroup):
    waiting_topic = State()


def main_keyboard():
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📝 Написать пост"),
             KeyboardButton(text="📧 Email-письмо"),
             KeyboardButton(text="🖥 Описание курса")],
            [KeyboardButton(text="🎬 Сторис-сценарий"),
             KeyboardButton(text="💡 Заголовки"),
             KeyboardButton(text="📊 Моя история")],
        ],
        resize_keyboard=True,
    )


def after_generation_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✏️ Доработать", callback_data="refine"),
            InlineKeyboardButton(text="🔄 Новый текст", callback_data="regen"),
        ],
        [
            InlineKeyboardButton(text="📋 Копировать", callback_data="copy"),
            InlineKeyboardButton(text="🏠 Главное меню", callback_data="home"),
        ],
    ])


async def generate(system_prompt: str, user_text: str) -> str:
    response = await groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text},
        ],
        temperature=0.8,
        max_tokens=2000,
    )
    return response.choices[0].message.content


# ── Команды ──────────────────────────────────────────────

@router.message(Command("start"))
async def cmd_start(message: Message, state: FSMContext):
    await state.clear()
    await message.answer(
        "👋 Привет! Я бот-копирайтер.\n\n"
        "Выбери формат контента в меню ниже 👇\n"
        "Или просто напиши тему — я сделаю пост.",
        reply_markup=main_keyboard(),
    )


@router.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(
        "📖 Как пользоваться ботом:\n\n"
        "1️⃣ Выбери формат в меню внизу\n"
        "2️⃣ Напиши тему\n"
        "3️⃣ Получи готовый текст\n\n"
        "Или просто отправь тему — получишь пост.\n\n"
        "Кнопки после генерации:\n"
        "✏️ Доработать — улучшить текст\n"
        "🔄 Новый текст — другой вариант\n"
        "📋 Копировать — текст без форматирования\n"
        "🏠 Главное меню — вернуться к выбору",
        reply_markup=main_keyboard(),
    )


# ── Главное меню (Reply-кнопки) ─────────────────────────

@router.message(F.text.in_(MENU_BUTTONS.keys()))
async def menu_selected(message: Message, state: FSMContext):
    content_type = MENU_BUTTONS[message.text]
    await state.update_data(content_type=content_type)
    await state.set_state(BotState.waiting_topic)

    labels = {
        "post": "📝 Напиши тему поста:",
        "email": "📧 Напиши тему письма:",
        "course": "🖥 Напиши тему/название курса:",
        "stories": "🎬 Напиши тему для сторис:",
        "headlines": "💡 Напиши тему для заголовков:",
        "story": "📊 Напиши тему истории:",
    }
    await message.answer(labels[content_type])


# ── Ввод темы (после выбора формата) ────────────────────

@router.message(BotState.waiting_topic)
async def handle_topic(message: Message, state: FSMContext):
    data = await state.get_data()
    content_type = data.get("content_type", "post")
    topic = message.text

    await state.update_data(topic=topic, last_result=None)
    await state.set_state(None)

    wait_msg = await message.answer("⏳ Генерирую...")

    try:
        system_prompt = PROMPTS[content_type]
        result = await generate(system_prompt, topic)
        await state.update_data(last_result=result)
        await wait_msg.delete()
        await message.answer(result, reply_markup=after_generation_keyboard())
    except Exception as e:
        await wait_msg.delete()
        await message.answer(f"❌ Ошибка генерации: {e}")


# ── Inline-кнопки после генерации ───────────────────────

@router.callback_query(F.data == "refine")
async def refine_text(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    last_result = data.get("last_result")

    if not last_result:
        await callback.message.answer("Нет текста для доработки. Выбери формат в меню.")
        await callback.answer()
        return

    wait_msg = await callback.message.answer("✏️ Дорабатываю...")

    try:
        result = await generate(REFINE_PROMPT, last_result)
        await state.update_data(last_result=result)
        await wait_msg.delete()
        await callback.message.answer(result, reply_markup=after_generation_keyboard())
    except Exception as e:
        await wait_msg.delete()
        await callback.message.answer(f"❌ Ошибка: {e}")

    await callback.answer()


@router.callback_query(F.data == "regen")
async def regenerate(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    topic = data.get("topic")
    content_type = data.get("content_type", "post")

    if not topic:
        await callback.message.answer("Нет сохранённой темы. Выбери формат в меню.")
        await callback.answer()
        return

    wait_msg = await callback.message.answer("🔄 Генерирую новый вариант...")

    try:
        system_prompt = PROMPTS[content_type]
        result = await generate(system_prompt, topic)
        await state.update_data(last_result=result)
        await wait_msg.delete()
        await callback.message.answer(result, reply_markup=after_generation_keyboard())
    except Exception as e:
        await wait_msg.delete()
        await callback.message.answer(f"❌ Ошибка: {e}")

    await callback.answer()


@router.callback_query(F.data == "copy")
async def copy_text(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    last_result = data.get("last_result")

    if not last_result:
        await callback.answer("Нет текста для копирования.")
        return

    safe_text = html.escape(last_result)
    await callback.message.answer(
        f"<pre>{safe_text}</pre>",
        parse_mode="HTML",
    )
    await callback.answer("📋 Текст отправлен для копирования")


@router.callback_query(F.data == "home")
async def go_home(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    await callback.message.answer(
        "Выбери формат контента 👇",
        reply_markup=main_keyboard(),
    )
    await callback.answer()


# ── Свободный текст (без выбора формата → пост) ─────────

@router.message(F.text)
async def handle_free_text(message: Message, state: FSMContext):
    topic = message.text
    await state.update_data(content_type="post", topic=topic, last_result=None)

    wait_msg = await message.answer("⏳ Пишу пост...")

    try:
        result = await generate(PROMPTS["post"], topic)
        await state.update_data(last_result=result)
        await wait_msg.delete()
        await message.answer(result, reply_markup=after_generation_keyboard())
    except Exception as e:
        await wait_msg.delete()
        await message.answer(f"❌ Ошибка: {e}")


# ── Запуск ───────────────────────────────────────────────

async def main():
    bot = Bot(token=TELEGRAM_BOT_TOKEN)
    dp = Dispatcher()
    dp.include_router(router)

    print("🤖 Бот запущен!")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
