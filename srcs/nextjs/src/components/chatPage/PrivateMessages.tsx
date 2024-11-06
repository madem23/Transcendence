import { useUserContext } from "@/contexts/UserContext";
import { PlayerData, UserData } from "@/types";
import { useEffect, useState } from "react";
import Paragraph from "../ui/Paragraph";
import ProfilePicStatus from "../ui/ProfilPicStatut";
import { useRoomContext } from "@/contexts/RoomContext";
import CloseDMButton from "./CloseDMButton";
import AchievementPopUp from '@/components/achievementPopUp/AchievementPopUp';

type PrivateMessagesProps = {
    className?: string;
};

const PrivateMessages: React.FC<PrivateMessagesProps> = ({ className }) => {
    const [PMList, setPMList] = useState<PlayerData[]>([]);
    const { user } = useUserContext();
    const { isUpdated, changeRoom, newMessage, activeRoom } = useRoomContext();
	const [clickedRoomName, setClickedRoomName] = useState('');


    useEffect(() => {
        const getPMList = async () => {
            const userIDs = Object.keys(user.privateMessages);
			if (userIDs.length === 0) {
				setPMList([]);
				return;
			}
			const IDlist = userIDs.join(' ');
			try {
				const response = await fetch(`/api/users/list_by_IDs/${IDlist}`, {
					method: 'GET',
					credentials: 'include',
				});
				if (!response.ok)
					throw new Error('fetch error, users not found');

				const data: PlayerData[] = await response.json();

				const users: PlayerData[] = data.map((user: PlayerData, index: number) => {
					const player: PlayerData = {
						id: user.id,
						username: user.username,
						level: user.level,
						wins: user.wins,
						losses: user.losses,
						rank: index + 1,
						avatar: user.avatar ? user.avatar : "/avatar.svg",
						status: user.status,
						isBlocked: user.isBlocked,
						isFriend: user.isFriend,
					};
					return player;
				});

				setPMList(users);
			} catch (error: any) {
				console.error(error);
			}
        }
        getPMList();
    }, [user, isUpdated]);

	useEffect(() => {
		const isActiveRoomInJoinedRooms = PMList.some(user => user.username === activeRoom);
		
		if (!isActiveRoomInJoinedRooms) {
			setClickedRoomName('');
		}
	}, [activeRoom, PMList, setClickedRoomName]);

    return (
		<div className={`HallOfFame ${className}`}>
			<Paragraph neon="blue">PRIVATE MESSAGES</Paragraph>

			<div className="list-container w-full overflow-y-auto pr-2">
				{PMList.map((user, index) => (
					<div key={index} className="list-item w-full px-2 py-4">

						<div className={`${(newMessage[user.username] && activeRoom !== user.username) && 'notif-test'} ${clickedRoomName === user.username ? 'notif-test2' : ''}  list-item-left shrink-1 overflow-x-hidden`}>
							<ProfilePicStatus player={user} />

							<Paragraph displayFlex={false} size="small" className={`${(newMessage[user.username] && activeRoom !== user.username) && 'filter2' }  ${clickedRoomName === user.username ? 'filter3' : ''} w-full text-ellipsis overflow-hidden whitespace-nowrap`}>
								<button className={`${(newMessage[user.username] && activeRoom !== user.username) && 'notif-test'}  ${clickedRoomName === user.username ? 'filter5' : ''} `} onClick={() => {changeRoom(user.id.toString())
								setClickedRoomName(user.username)}}>{user.username}</button>
							</Paragraph>
						</div>
						<div className="list-item-right shrink-0">
							{<CloseDMButton partnerID={user.id} />}
						</div>
					</div>
				))}
			</div>
			<AchievementPopUp />
		</div>
    );
}

export default PrivateMessages;