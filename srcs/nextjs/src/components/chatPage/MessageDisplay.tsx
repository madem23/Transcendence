import { FC, useRef } from 'react'
import React from 'react';
import Paragraph from '../ui/Paragraph';
import { useRoomContext } from '@/contexts/RoomContext';
import { useState } from 'react';
import { useEffect } from 'react';
import { useUserContext } from '@/contexts/UserContext';
import { Message, PlayerData } from '@/types';
import OwnedRoomSettings from './OwnedRoomSettings';
import axios from 'axios';
import { toast } from '../ui/Toast';
import { setAchievementByName } from '../achievements';
import AchievementPopUp from '../achievementPopUp/AchievementPopUp';

interface QLFProps {
  className?: string;
}

const MessageDisplay: FC<QLFProps> = ({ className }) => {
  const { activeRoom, roomMessages, isPM, isUpdated } = useRoomContext();
  const { user } = useUserContext();
  const [messagesHistory, setMessagesHistory] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [modalRules, setModalRules] = useState(false);
  const [modalSetting, setModalSetting] = useState(false);
  const [role, setRole] = useState('');
  const [roomType, setRoomType] = useState<string>('');

  const checkIfOwned = async () => {
    if (activeRoom.trim() === "") {
      setRole('');
      return;
    }
    try {
      const roomInfo = await axios.get(`/api/rooms/${activeRoom}`);
      if (roomInfo.data !== "" && roomInfo.data.users[user.login]) {
        setRole(roomInfo.data.users[user.login]);
        setRoomType(roomInfo.data.type);
      }
      else
        setRole('');
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    checkIfOwned();
  }, [activeRoom, isUpdated]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isPM && roomMessages[activeRoom])
        setMessagesHistory(roomMessages[activeRoom]);
      else if (isPM) {
        const partner = await axios.get<PlayerData>(`/api/users/by_username/${activeRoom}`);
        setMessagesHistory(user.privateMessages[partner.data.id]);
      }
      else
        setMessagesHistory([]);
    }
    fetchData();
  }, [user.privateMessages, roomMessages[activeRoom], activeRoom]);

  const [isHovered, setIsHovered] = useState(false);
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const toPin = () => {

  }
  
  const openModal = () => {
    if (activeRoom)
      setModalSetting(true);
  };

  const closeModal = () => {
    setModalRules(false);
    setModalSetting(false);


  };

  const openRules = () => {
    if (activeRoom)
      setModalRules(true)
  }

	const notTheOwner = () => {
		toast({
			title:"Error",
			message:"Sorry you are not the owner of this room",
			type:"error"
		})
		closeModal();
		return null;
	}

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
}

useEffect(() => {
  scrollToBottom();
}, [messagesHistory]);


  return (
    <div className={`${className} QLF`}>
      <div className='flex justify-between'>
        <Paragraph displayFlex={false} neon="blue">{activeRoom || "No room or private message selected"}</Paragraph>
        <div className='flex gap-2'>
          <button onClick={toPin}>
            <img
              src="info.svg"
              alt="Command"
              className="play-logo"
              onClick={openRules}
            />
          </button>
          <button onClick={role === "owner" ? openModal : notTheOwner}>
            <img src="/setting.svg" alt="setting Icon" className="setting-icon" />
          </button>
        </div>
      </div>
      <div className="overflow-y-auto mr-2 p-2 new-elem" ref={messagesEndRef}>
        <div className="chat-container">
          {Array.isArray(messagesHistory) && messagesHistory.map((msg, index) => (
            <React.Fragment key={index}>
              <div className="flex flex-col">
              <div className='flex gap-2'>
                <Paragraph title={`Sent ${msg.date}`}>{msg.time}</Paragraph>
                <Paragraph style={{
                  color:
                    msg.role === 'owner'
                      ? '#F0F' // Change 'color1' to the desired color for owner
                      : msg.role === 'admin'
                        ? '#0FF' // Change 'color2' to the desired color for admin
                        : msg.role === 'muted'
                          ? '#5A5A5A' // Change 'color3' to the desired color for muted
                          : 'white' // Default color
                }} title={`Sent ${msg.date}`}>{msg.senderUsername}
                </Paragraph>
                </div>
                <Paragraph className='mt-1' displayFlex={false} title={`Sent ${msg.date}`}>{msg.content}</Paragraph>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      {modalRules && activeRoom && (
        <div className='modal'>
          <div className='modal-content p-4 gap-10 relative pt-[20px]'>
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                color: 'white',
                background: 'none',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer',
                filter: isHovered ? 'drop-shadow(0px 0px 10px #F0F)' : 'none'  
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <img className="h-[20px] w-[20px] invert-[1]" src="/cross-icone.svg" alt="Close" />
            </button>

            <div className='flex flex-row gap-2 text-center justify-center items-center'>
              <p className='font'>RULES - COMMANDS</p>
              <img onClick={() => setAchievementByName('b4rb4te')} src="/BARBATE_.png" alt="BARBATE" className="theme-logo cursor-pointer" />
            
            </div>
            <div className='flex gap-5 flex-col justify-center align-center items-center'>
              <div className='flex gap-1 flex-col justify-center align-center items-center'>
                <Paragraph>Welcome To the Rules - Commands Modal!</Paragraph>
                <Paragraph>Here is a little description of the differents rules and commands</Paragraph>
              </div>
              <p className='flex text-center justify-center font-press-start-2p text-[16px] text-white text-shadow-blue'>RULES</p>
              <div className='flex gap-1 flex-col justify-center align-center items-center'>
                <Paragraph>First theres are 3 roles: Owner, Admin, Public</Paragraph>
                <div className='flex flex-col text-left'>
                  <Paragraph className='text-left'>Owner: If you are owner you can change the </Paragraph>
                  <Paragraph className='text-left'>room's setting and grade any users to admin</Paragraph>
                  <Paragraph className='text-left'>You can also invite, ban, kick or mute whoever you want</Paragraph>
                </div>
                <Paragraph>Admin: you can kick, ban or mute (for a limited time)</Paragraph>
                <Paragraph>other users, but not the channel's owner.</Paragraph>
                <Paragraph>Regular: You can enjoy the chat</Paragraph>
              </div>
              {(role === "owner" || role === "admin") && (
                <>
                  <p className='flex text-center justify-center font-press-start-2p text-[16px] text-white text-shadow-blue'>COMMANDS</p>
                  <div className='flex gap-1 flex-col justify-center align-center items-center'>
                    <Paragraph>List of available commands:</Paragraph>
                    <Paragraph>/kick [user]: kick user from the current room</Paragraph>
                    <Paragraph>/ban [user]: ban user from the current room</Paragraph>
                    <Paragraph>/unban [user]: unban user from the current room</Paragraph>
                    <Paragraph>/mute [user] [time]: mute user from the current room for [time] seconds</Paragraph>
                    <Paragraph>/unmute [user]: unmute user from the current room</Paragraph>
                    {role === "owner" && (
                      <>
                        <Paragraph>/invite [user]: invite user to the current room</Paragraph>
                        <Paragraph>/promote [user]: promote user to admin in the current room</Paragraph>
                        <Paragraph>/demote [user]: demote admin to regular user in the current room</Paragraph>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {modalSetting && activeRoom && (
        <div className='modal'>
          <div className='modal-content p-4 gap-10 relative'>
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                color: 'white',
                background: 'none',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer',
                filter: isHovered ? 'drop-shadow(0px 0px 10px #F0F)' : 'none'  
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <img className="h-[20px] w-[20px] invert-[1]" src="/cross-icone.svg" alt="Close" />
            </button>
            <p className='font'>ROOM SETTINGS</p>
            <OwnedRoomSettings roomType={roomType} closeModal={closeModal} />
          </div>
        </div>
      )}
      <AchievementPopUp/>
    </div>
  )
}

export default MessageDisplay