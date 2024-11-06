import React, { createContext, useContext, useState } from 'react';

interface WaitingRoomModalContextProps {
  isWaitingRoomModalOpen: boolean;
  setWaitingRoomModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  waitingRoomModalContent: any;
  setWaitingRoomModalContent: React.Dispatch<React.SetStateAction<any>>;
}

const WaitingRoomModalContext = createContext<WaitingRoomModalContextProps | null>(null);

interface Props {
  children: React.ReactNode;
}


export const WaitingRoomModalProvider = ({ children }: Props) => {
  const [isWaitingRoomModalOpen, setWaitingRoomModalOpen] = useState(false);
  const [waitingRoomModalContent, setWaitingRoomModalContent] = useState({});

  return (
    <WaitingRoomModalContext.Provider value={{
      isWaitingRoomModalOpen,
      setWaitingRoomModalOpen,
      waitingRoomModalContent,
      setWaitingRoomModalContent,
    }}>
      {children}
    </WaitingRoomModalContext.Provider>
  );
};

export const useWaitingRoomModal = () => {
  const context = useContext(WaitingRoomModalContext);
  if (!context) {
    throw new Error('useWaitingRoomModal must be used within a WaitingRoomModalProvider');
  }
  return context;
};
