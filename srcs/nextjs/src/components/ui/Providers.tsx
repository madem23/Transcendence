import { ThemeProvider } from "next-themes"
import { ReactNode } from 'react'
import { UserContextProvider } from "@/contexts/UserContext"
import { WebsocketContextProvider } from "@/contexts/WebsocketContext"
import { RoomContextProvider } from "@/contexts/RoomContext"
import { GameProvider } from "@/contexts/GameContext"
import { WaitingRoomModalProvider } from "@/contexts/WaitingRoomModalContext"

const Providers = ({ children }: { children: ReactNode }) => {
	return (
		<UserContextProvider>
			<GameProvider>
				<RoomContextProvider>
					<WebsocketContextProvider>
						<ThemeProvider attribute='class' defaultTheme='system' enableSystem>
							{children}
						</ThemeProvider>
					</WebsocketContextProvider>
				</RoomContextProvider>
			</GameProvider>
		</UserContextProvider>
	);
};



export default Providers