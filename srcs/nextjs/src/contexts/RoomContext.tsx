import React, { createContext, useState, ReactNode, SetStateAction, Dispatch, useContext } from 'react';
import axios from 'axios'
import { Message, PlayerData } from '@/types';
import { useUserContext } from './UserContext';

interface RoomContextType {
  activeRoom: string;
  isUpdated: boolean;
  toggleUpdate: () => void;
  changeRoom: (newRoom: string) => void;
  roomMessages: { [key: string]: Message[] };
  setRoomMessages: Dispatch<SetStateAction<{ [key: string]: Message[] }>>;
  isPM: boolean;
  newMessage: { [key: string]: boolean }
  setNewMessage: Dispatch<SetStateAction<{ [key: string]: boolean }>>;
}

const RoomContext = createContext<RoomContextType>({
  activeRoom: '',
  isUpdated: false,
  toggleUpdate: () => { },
  changeRoom: () => { },
  roomMessages: {},
  setRoomMessages: () => { },
  isPM: false,
  newMessage: {},
  setNewMessage: () => { },
});

export const useRoomContext = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoomContext must be used within a UserContextProvider');
  }
  return context;
}

const RoomContextProvider = ({ children }: { children: ReactNode }) => {
  const [isUpdated, setUpdated] = useState(false);
  const [isPM, setPM] = useState(false);
  const [activeRoom, setActiveRoom] = useState('');
  const [roomMessages, setRoomMessages] = useState<{ [key: string]: Message[] }>({});
  const [newMessage, setNewMessage] = useState<{ [key: string]: boolean }>({});
  const { user } = useUserContext();

  const toggleUpdate = () => {
    setUpdated((prevValue) => !prevValue);
  };

  const changeRoom = async (newRoom: string) => {

    if (newRoom.trim() !== '') {
      try {
        const roomInfo = await axios.get(`/api/rooms/${newRoom}`)
        if (roomInfo.data !== "") {
          setPM(false);
          const userStatus = roomInfo.data.users[user.login];
          if (userStatus) {
            setActiveRoom(newRoom);
            setNewMessage(prev => {
              return { ...prev, [newRoom]: false };
            });
          }
          else
            setActiveRoom('');
        }
        else if (parseInt(newRoom) in user.privateMessages) {
          setPM(true);
          try {
            const partner = await axios.get<PlayerData[]>(`/api/users/list_by_IDs/${newRoom}`);
            setActiveRoom(partner.data[0].username);
            setNewMessage(prev => {
              return { ...prev, [partner.data[0].username]: false };
            });
          }
          catch (error) {
            console.error(error);
          }
        }
        else {
          setPM(false);
          setActiveRoom('');
        }
      } catch (error) {
        console.error(error);
      }
    }
    else {
      setPM(false);
      setActiveRoom('');
    }
  }

  return (
    <RoomContext.Provider value={{ isUpdated, toggleUpdate, activeRoom, changeRoom, roomMessages, setRoomMessages, isPM, newMessage, setNewMessage }}>
      {children}
    </RoomContext.Provider>
  );
}

export { RoomContext, RoomContextProvider };
