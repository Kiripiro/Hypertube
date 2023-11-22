/* Chat */
export interface Block {
	id: number;
	author_id: number;
	blocked_user_id: number;
	isBlocked: boolean;
}

export interface User {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	picture_1: string;
	status: string;
	block: Block;
	notificationCount?: number;
}

export interface Message {
	id: number;
	author_id: number;
	recipient_id: number;
	message: string;
	date: Date;
}

export interface StatusData {
	userId: number;
	status: string;
}

/* Auth */
export interface RegisterResponseData {
	message: string;
	user: {
		id: number,
		username: string,
		email: string,
		firstName: string,
		lastName: string,
		email_checked: boolean,
	};
}

export interface LoginResponseData {
	message: string;
	user: {
		id: number,
		username: string,
		firstName: string,
		lastName: string,
		email_checked: boolean,
		avatar: string,
	};
}

export interface GetUserResponseData {
	message: string;
	user: {
		id: number,
		username: string,
		firstName: string,
		lastName: string,
		email_checked: boolean,
		avatar: string,
	};
}

export interface loginGoogleResponseData {
	message: string;
	user: {
		id: number,
		username: string,
		firstName: string,
		lastName: string,
		email_checked: boolean,
		avatar: string,
	};
}

export interface HomeUserData {
	id: number,
	username: string,
	firstName: string,
	lastName: string,
	age: number,
	complete_register: boolean,
	gender: string,
	sexual_preferences: string[],
	biography: string,
	picture_1: string,
	picture_2: string,
	picture_3: string,
	picture_4: string,
	picture_5: string,
	tags: string[],
	fame_rating: number,
	you_blocked_he: boolean,
	he_blocked_you: boolean,
	you_reported_he: boolean,
}

export interface CompleteRegisterResponseData {
	message: string;
	user: {
		gender: string,
		sexual_preferences: string,
		biography: string,
		picture_1: string,
		picture_2: string,
		picture_3: string,
		picture_4: string,
		picture_5: string,
		tags: UserTags[]
	};
}

export interface UpdateLocationResponseData {
	message: string;
	user: {
		latitude: number,
		longitude: number,
		city: string
	};
}

export interface IpApiResponseData {
	status: string;
	lat: number;
	lon: number;
}

export interface LocationIQApiResponseData {
	address: {
		city: string;
		municipality: string;
	};
}

export interface EmailValidationResponseData {
	message: string;
	error: string;
}

export interface PasswordResetRequestResponseData {
	message: string;
	error: string;
}

export interface PasswordResetValidationResponseData {
	message: string;
	error: string;
}


/* Sockets */
export interface StatusData {
	userId: number;
	status: string;
}

/* Relations */
export interface CheckLikeResponseData {
	exist: boolean;
}

export interface CheckMatchResponseData {
	exist: boolean;
}

export interface CreateLikeResponseData {
	message: string;
	likeId: Number;
}

export interface DeleteLikeResponseData {
	message: string;
	deleted: boolean;
}

export interface CreateBlockResponseData {
	message: string;
	blockId: number;
	data: {
		author_id: number,
		recipient_id: number
	};
}

export interface DeleteBlockResponseData {
	message: string;
}

export interface CreateReportResponseData {
	message: string;
	blockId: number;
	data: {
		author_id: number,
		recipient_id: number
	};
}

export interface CreateBlockResponseData {
	message: string;
	blockId: number;
	data: {
		author_id: number,
		recipient_id: number
	};
}

export interface DeleteReportResponseData {
	message: string;
}

export interface CreateViewResponseData {
	message: string;
}

export interface GetAllProfileViewsResponseData {
	data: {
		author_id: number,
		authorUsername: string,
		authorFirstName: string,
		authorLastName: string,
		recipient_id: number
	}[];
}

export interface GetAllProfileLikesResponseData {
	data: {
		author_id: number,
		authorUsername: string,
		authorFirstName: string,
		authorLastName: string,
		recipient_id: number
	}[];
}

/* Home */
export interface UserSimplified {
	id: number,
	username: string,
	age: number,
	tags: UserTags[],
	latitude: number,
	longitude: number,
	fame_rating: number,
	firstName: string,
	lastName: string,
	city: string
}

export interface UserTags {
	owner_id: number,
	name: string
}

export interface GetInterestingUsersResponseData {
	users: UserSimplified[]
}

export interface GetFameRatingResponseData {
	fame_rating: number
}

export const sortSelectType = {
	Location: "Location",
	Age: "Age",
	Tags: "Tags",
	FameRating: "Fame rating"
}

export const filterSelectType = {
	Location: "to less than 20km",
	Age: "+/- 5 years",
	Tags: "3 common tags minimum",
	FameRating: "Fame rating"
}

/* Search */

export const ageGapType = {
	_18_25: "18-25",
	_26_35: "26-35",
	_36_50: "36-50",
	_51: "+51"
}

export const fameRatingGapType = {
	_30: "-30",
	_31_60: "31-60",
	_61_100: "61-100",
	_101_150: "101-150",
	_151_250: "151-250",
	_251: "+251"
}

export interface GetCitiesResponseData {
	cities: string[]
}

export interface GetSearchResultResponseData {
	users: UserSimplified[]
}

/* Settings */
export interface UserSettings {
	username: string;
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	confirm_password: string;
	gender: string;
	sexual_preferences: string[];
	biography: string;
	picture_1: string;
	picture_2: string;
	picture_3: string;
	picture_4: string;
	picture_5: string;
	tags: string[];
	latitude: number;
	longitude: number;
	city: string;
}

/* Tags */
export interface Tag {
	id: number;
	name: string;
	owner_id: number;
}

/* Profile */
export interface ElementListData {
	author_id: number,
	authorUsername: string,
	authorFirstName: string,
	authorLastName: string,
	recipient_id: number
}

/* Notifications */
export interface Notification {
	author_id?: number,
	type: string,
	strong?: string,
	message: string,
}