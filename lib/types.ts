export interface Deck {
	id: string;
	user_id: string;
	topic: string;
	created_at: string;
}

export interface CardContent {
	question: string;
	answer: string;
	explanation?: string;
	type: 'basic' | 'choice' | 'input';
	options?: string[];
}

export interface Card {
	id: string;
	deck_id: string;
	front?: string;
	back?: string;
	content?: CardContent;
	card_type?: string;
	interval: number;
	ease_factor: number;
	next_review: string;
	difficulty?: number;
	created_at: string;
}

export interface Profile {
	id: string;
	xp: number;
	health: number;
	stage: string;
	updated_at: string;
	coins: number;
	current_streak: number;
	last_study_date?: string;
	pet_name?: string;
	pet_type?: string;
	learning_goals?: string[];
}
