import { ActivityCategory, SubCategory } from '../types';

export const categories: ActivityCategory[] = [
    {
        id: 'sport',
        name: 'Спорт',
        icon: 'sport',
        hasLevel: true,
        subcategories: [
            { id: 'running', name: 'Бег', hasLevel: true },
            { id: 'football', name: 'Футбол', hasLevel: true },
            { id: 'basketball', name: 'Баскетбол', hasLevel: true },
            { id: 'volleyball', name: 'Волейбол', hasLevel: true },
            { id: 'tennis', name: 'Теннис', hasLevel: true },
            { id: 'yoga', name: 'Йога', hasLevel: true },
            { id: 'fitness', name: 'Фитнес', hasLevel: true },
            { id: 'swimming', name: 'Плавание', hasLevel: true },
            { id: 'cycling', name: 'Велоспорт', hasLevel: true },
            { id: 'hockey', name: 'Хоккей', hasLevel: true },
            { id: 'skating', name: 'Коньки', hasLevel: true },
            { id: 'skiing', name: 'Лыжи', hasLevel: true },
            { id: 'boxing', name: 'Бокс', hasLevel: true },
            { id: 'martial-arts', name: 'Единоборства', hasLevel: true },
            { id: 'climbing', name: 'Скалолазание', hasLevel: true },
        ]
    },
    {
        id: 'creative',
        name: 'Творчество',
        icon: 'creative',
        hasLevel: true,
        subcategories: [
            { id: 'drawing', name: 'Рисование', hasLevel: true },
            { id: 'photography', name: 'Фотография', hasLevel: true },
            { id: 'painting', name: 'Живопись', hasLevel: true },
            { id: 'sculpture', name: 'Скульптура', hasLevel: true },
            { id: 'crafts', name: 'Рукоделие', hasLevel: true },
            { id: 'pottery', name: 'Керамика', hasLevel: true },
            { id: 'design', name: 'Дизайн', hasLevel: true },
            { id: 'writing', name: 'Литература', hasLevel: true },
            { id: 'calligraphy', name: 'Каллиграфия', hasLevel: true },
        ]
    },
    {
        id: 'education',
        name: 'Образование',
        icon: 'education',
        hasLevel: true,
        subcategories: [
            { id: 'languages', name: 'Языки', hasLevel: true },
            { id: 'programming', name: 'Программирование', hasLevel: true },
            { id: 'math', name: 'Математика', hasLevel: true },
            { id: 'science', name: 'Наука', hasLevel: true },
            { id: 'history', name: 'История', hasLevel: true },
            { id: 'philosophy', name: 'Философия', hasLevel: true },
            { id: 'psychology', name: 'Психология', hasLevel: true },
            { id: 'finance', name: 'Финансы', hasLevel: true },
            { id: 'business', name: 'Бизнес', hasLevel: true },
        ]
    },
    {
        id: 'games',
        name: 'Игры',
        icon: 'games',
        hasLevel: false,
        subcategories: [
            { id: 'board-games', name: 'Настольные игры', hasLevel: false },
            { id: 'card-games', name: 'Карточные игры', hasLevel: false },
            { id: 'video-games', name: 'Видеоигры', hasLevel: false },
            { id: 'mafia', name: 'Мафия', hasLevel: false },
            { id: 'chess', name: 'Шахматы', hasLevel: true },
            { id: 'poker', name: 'Покер', hasLevel: true },
            { id: 'dnd', name: 'D&D', hasLevel: false },
            { id: 'quiz', name: 'Квизы', hasLevel: false },
        ]
    },
    {
        id: 'music',
        name: 'Музыка',
        icon: 'music',
        hasLevel: true,
        subcategories: [
            { id: 'concerts', name: 'Концерты', hasLevel: false },
            { id: 'karaoke', name: 'Караоке', hasLevel: false },
            { id: 'guitar', name: 'Гитара', hasLevel: true },
            { id: 'piano', name: 'Фортепиано', hasLevel: true },
            { id: 'drums', name: 'Ударные', hasLevel: true },
            { id: 'singing', name: 'Вокал', hasLevel: true },
            { id: 'djing', name: 'Диджеинг', hasLevel: true },
            { id: 'production', name: 'Музыкальное производство', hasLevel: true },
        ]
    },
    {
        id: 'food',
        name: 'Еда',
        icon: 'food',
        hasLevel: false,
        subcategories: [
            { id: 'cooking', name: 'Готовка', hasLevel: true },
            { id: 'baking', name: 'Выпечка', hasLevel: true },
            { id: 'restaurants', name: 'Рестораны', hasLevel: false },
            { id: 'wine-tasting', name: 'Дегустация вина', hasLevel: true },
            { id: 'coffee', name: 'Кофе', hasLevel: true },
            { id: 'tea', name: 'Чай', hasLevel: true },
            { id: 'vegetarian', name: 'Вегетарианство', hasLevel: false },
            { id: 'street-food', name: 'Уличная еда', hasLevel: false },
        ]
    },
    {
        id: 'nature',
        name: 'Природа',
        icon: 'nature',
        hasLevel: false,
        subcategories: [
            { id: 'hiking', name: 'Походы', hasLevel: true },
            { id: 'camping', name: 'Кемпинг', hasLevel: false },
            { id: 'picnic', name: 'Пикник', hasLevel: false },
            { id: 'bird-watching', name: 'Наблюдение за птицами', hasLevel: true },
            { id: 'gardening', name: 'Садоводство', hasLevel: true },
            { id: 'fishing', name: 'Рыбалка', hasLevel: true },
            { id: 'mushroom-picking', name: 'Грибы', hasLevel: true },
        ]
    },
    {
        id: 'cinema',
        name: 'Кино',
        icon: 'cinema',
        hasLevel: false,
        subcategories: [
            { id: 'movies', name: 'Кинотеатры', hasLevel: false },
            { id: 'film-club', name: 'Киноклуб', hasLevel: false },
            { id: 'series', name: 'Сериалы', hasLevel: false },
            { id: 'filmmaking', name: 'Кинопроизводство', hasLevel: true },
            { id: 'documentary', name: 'Документалистика', hasLevel: true },
            { id: 'animation', name: 'Анимация', hasLevel: true },
        ]
    },
];

export const subcategoryById = new Map<string, SubCategory>(
    categories.flatMap((category) =>
        category.subcategories.map((sub) => [sub.id, sub] as const)
    )
);
