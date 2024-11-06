import { useUserContext } from "@/contexts/UserContext";
import { useWebsocketContext } from "@/contexts/WebsocketContext";
import axios from 'axios'
import { useRoomContext } from "@/contexts/RoomContext";

interface CloseDMButtonProps {
	partnerID: number;
}

const CloseDMButton = ({ partnerID }: CloseDMButtonProps) => {
	const socket = useWebsocketContext();
	const { updateUser } = useUserContext();
	const { changeRoom } = useRoomContext();

	const closeDM = async () => {
		try {
			await axios.put(`/api/users/closeDM`, { partner: partnerID });
		} catch (error) {
			console.error("Error closing DM", error);
		}
		changeRoom('');
		updateUser();
		socket?.emit('chatUpdate');
	}

	return <button onClick={closeDM}>
		<img src="/leave-btn.svg" />

	</button>
}

export default CloseDMButton