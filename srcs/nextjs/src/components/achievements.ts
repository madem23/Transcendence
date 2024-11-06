import { atoast } from "@/components/ui/ToastAchievement";

export const achievementsData = [
	{
		name: 'welcome_mdemma',
		title: 'Welcome 2 The Jungle',
		message: 'Mdemma welcomes you to Ultimate Pong!',
		link: '/achievements/a01_welcome_mdemma.png',
	},
	{
		name: 'first_blood',
		title: 'First Blood',
		message: 'You drew first blood on the Pong battlefield! The pixel wars have begun!',
		link: '/achievements/a03_first_blood.png',
	},
	{
		name: 'first_loss',
		title: 'Shit Happens',
		message: "Oops! You've just lost your first game of Pong. It's all fun and games until you meet a pixel ball!",
		link: '/achievements/a04_first_loss.png',
	},
	{
		name: 'first_play',
		title: "Let's Play",
		message: "You've played your first game in the Pong arena. The start of a pixelated adventure!",
		link: '/achievements/a02_first_play.png',
	},
	{
		name: 'win_vs_mmidon',
		title: 'Finish her!!!',
		message: "You've defeated the legendary Mmidon herself! Your pixelated victory will be remembered in Pong history!",
		link: '/achievements/a06_win_vs_mmidon.png',
	},
	{
		name: 'level_21',
		title: "It's A Long Way To The Top",
		message: "You're now level 21 in Pong with paddle skills as sharp as a dealer's cards!",
		link: '/achievements/a09_level_21.png',
	},
	{
		name: '100_wins',
		title: "Just Hangin' Around",
		message: "You've won 100 Pong games! You're officially a pixelated Pong legend!",
		link: '/achievements/a10_100_wins.png',
	},
	{
		name: 'kiss_it_flemaitr',
		title: 'Kiss It!',
		message: 'You kissed the legendary Flemaitr! Making Opponents Dance to the Pong Rhythm with a 0 Score!',
		link: '/achievements/a11_kiss_it_flemaitr.png',
	},
	{
		name: 'dm_bleotard',
		title: 'With Great Power...',
		message: "You've mastered the art of direct messaging! With Great Power Comes Great Pongsibility.'",
		link: '/achievements/a08_dm_bleotard.png',
	},
	{
		name: 'hidden_cjunker',
		title: 'Elementary My Dear',
		message: "You've uncovered a hidden treasure, thanks to your keen eye! Keep exploring for more secrets.",
		link: '/achievements/a07_hidden_cjunker.png',
	},
	{
		name: 'first_friend',
		title: "I'll Be There 4 You",
		message: "Just like the TV show, you've got your own 'Central Pong'",
		link: '/achievements/a05_first_friend.png',
	},
	{
		name: 'b4rb4te',
		title: "barbate",
		message: "barbate barbate barbate barbate barbate barbate barbate (thx a lot for the server)",
		link: '/BARBATE_.png',
	},
];


export async function setAchievementByName(name: string) {
	try {

		const response = await fetch(`/api/users/achievements`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify({ data: name }),

		});
		if (response.ok) {
			const resBody = await response.json();
			if (resBody.message === true) {
				const achObj = achievementsData.find(ach => ach.name === name);
				if (achObj) {
					atoast({
						title: achObj.title,
						message: achObj.message,
						link: achObj.link,
						type: 'success',
					});
				}
			}
		}

	} catch (error) {
		console.error(`Fetch Error: ${error}`);
		return null;
	}
}
