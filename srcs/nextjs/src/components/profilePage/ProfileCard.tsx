import React, { useState } from 'react';
import Paragraph from '../ui/Paragraph';
import { useUserContext } from '@/contexts/UserContext';
import { useEffect } from 'react';
import { useRef } from 'react';
import { toast } from '../ui/Toast'
import { FC } from 'react';
import Modal from 'react-modal';
import Button from '../ui/Button';
import { useWebsocketContext } from '@/contexts/WebsocketContext';
import classNames from 'classnames';


interface ProfileCardProps {
	className?: string;
}

const ProfileCard: FC<ProfileCardProps> = ({ className }) => {
	const { user, updateUser } = useUserContext();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const usernameInputRef = useRef<HTMLInputElement>(null);
	const [editedUsername, setEditedUsername] = useState(user.username || '');
	const [is2FAActive, set2FAActive] = useState(false);
	const [qrCodeURL, setQrCodeURL] = useState<string | null>(null);
	const [modalIsOpen, setModalIsOpen] = useState(false);
	const socket = useWebsocketContext();
	const [lastClicked, setLastClicked] = useState<Date | null>(null);


	useEffect(() => {
		const check2FAStatus = async () => {
			try {
				const response = await fetch(`/api/users/user_info`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				});
				if (!response.ok) {
					throw new Error('Failed to fetch user info');
				}

				const data = await response.json();
				if (data.twofa) {
					set2FAActive(true);
				}
			} catch (error) {
				console.error("Error in checking 2FA status:", error);
			}
		};
		check2FAStatus();
	}, [is2FAActive]);

	useEffect(() => {
		if (user.username) {
			setEditedUsername(user.username);
		}
		if (usernameInputRef.current !== null) {
			usernameInputRef.current.setAttribute("style", `width:  min(${mesureTextWidth(user.username, usernameInputRef.current.className)}px, 100%)`);
		}

	}, [user.username]);

	const closeModal = () => {
		setModalIsOpen(false);
	};

	const handleEditClick = () => {
		if (fileInputRef.current !== null) {
			fileInputRef.current.click();
		}
	};

	const handleEditClick2 = () => {

		if (usernameInputRef.current !== null) {
			usernameInputRef.current.disabled = false;
			requestAnimationFrame(() => {
				if (usernameInputRef.current !== null) {
					usernameInputRef.current.focus();
				}
			})
		}

	};
	const handleConfirmEdit = async () => {
		const now = new Date();

		try {
			const response = await fetch(`/api/users/update-profile`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					username: editedUsername,
				}),
				credentials: 'include',
			});



			if (!response.ok || lastClicked && (now.getTime() - lastClicked.getTime()) < 60000) {
				if (!response.ok) {
					toast({
						title: "Error",
						message: "It did not work, try with another username",
						type: "error"
					});
				}
				else if (lastClicked && (now.getTime() - lastClicked.getTime()) < 60000) {
					toast({
						title: "OH CALM DOWN !",
						message: "Spam are not allowed here! try in few second",
						type: "error"
					});

				}
				setEditedUsername(user.username);
				throw new Error("the username update did not work");
			}
			else {
				setLastClicked(now);
				toast({
					title: "Congratulations !",
					message: `You've successfully changed your username to : ${editedUsername}`,
					type: "success"
				});
				socket?.emit('usernameChange', { oldName: user.username, newName: editedUsername });
				updateUser();
			}
		} catch (error) {
			console.error(error);
		}
	};

	const activate2FA = async () => {
		try {
			const response = await fetch(`/api/2fa/generate`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
			});

			if (!response.ok) {
				throw new Error('Failed to generate 2FA QR code');
			}

			const imageBlob = await response.blob();
			const blobURL = URL.createObjectURL(imageBlob);

			setQrCodeURL(blobURL);

		} catch (error) {
			console.error("Error in activating 2FA:", error);
		}
	};

	const deactivate2FA = async () => {
		try {
			const response = await fetch(`/api/2fa/turn-off`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
			});

			if (!response.ok) {
				toast({
					title: "Error !",
					message: "You can not deactivate 2FA, please try again",
					type: "error"
				});
				throw new Error('Failed to deactivate 2FA');
			}

			if (response.status === 200) {
				set2FAActive(false);
				setQrCodeURL(null);
				toast({
					title: "Congratulations !",
					message: "You've successfully deactivated 2FA authentificator",
					type: "success"
				});
			}
		} catch (error) {
			console.error("Error in activating 2FA:", error);
		}
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files ? e.target.files[0] : null;
		if (!selectedFile) return;

		try {
			const data = new FormData();
			data.set('file', selectedFile);

			const res = await fetch('/api/users/avatar', {
				method: 'PATCH',
				body: data,
			});
			if (!res.ok) {
				if (res.status === 413) {
					toast({
						title: "Upload failed",
						message: "The picture is too large, must be < 25MB",
						type: "error"
					});
				}
				else {
					const body = await res.json();
					toast({
						title: "Upload failed",
						message: body.message,
						type: "error"
					});
				}
			} else {
				toast({
					title: "Oh my! Georgeous!",
					message: `You've successfully changed your ProfilPic`,
					type: "success"
				});
				updateUser();
			}
		} catch (e: any) {
			console.error(e);
		}
	};
	const [twoFactorCode, setTwoFactorCode] = useState<string>("");

	const verify2FA = async () => {
		try {
			const response = await fetch(`/api/2fa/turn-on`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					twoFACode: twoFactorCode,
				}),
			});
			const data = response.headers.get("content-length") && Number(response.headers.get("content-length")) > 0
				? await response.json()
				: {};

			if (response.ok) {
				set2FAActive(true);
				setQrCodeURL(null);
				setModalIsOpen(false);
				toast({
					title: "Congratulations !",
					message: "You've successfully activated 2FA authentificator",
					type: "success"
				});
			} else {
				toast({
					title: "Error",
					message: "2fa activation failed. Please try again",
					type: "error"
				});
			}
			setTwoFactorCode('');
		} catch (error) {
			console.error("Erreur lors de la vérification du code 2FA:", error);
		}
	};


	const mesureTextWidth = (textContent: string, className: string) => {
		const container: HTMLSpanElement = document.createElement("span");
		const text: HTMLSpanElement = document.createElement("span");

		text.className = className;
		text.textContent = textContent;

		container.appendChild(text);
		document.body.append(container);

		const width = text.getBoundingClientRect().width;

		document.body.removeChild(container);

		return width;
	}

	const toggle2FA = () => {
		if (is2FAActive) {
			deactivate2FA();
			set2FAActive(false);
		} else {
			setModalIsOpen(true);
			activate2FA();
		}
	};
	return (
		<div className={`card-layout ${className}`}>
			<div className="card-layout2">
				<div className='flex justify-between pb-1'>
					<Paragraph neon="blue">
						YOUR PROFILE
					</Paragraph>
				</div>
				<div className="card-container1 mb-2">
					<div className="profile-wrapper rounded-full">
						<img src={user.avatar} alt="Profile Pic" className="profile-image" />
						<div className="hover-content absolute inset-0 flex items-center justify-center">
							<div onClick={handleEditClick} className="cursor-pointer hover:underline flex items-center">
								<Paragraph displayFlex={false} size="small" className='hover:underline'>EDIT</Paragraph>
								<img src="icon-edit.svg" alt="Edit Icon" className="icon-edit ml-2" />
							</div>
						</div>
					</div>
					<div className="player-info">
						<div className="login">
							<Paragraph displayFlex={false} neon="magenta">LOGIN</Paragraph>
							<Paragraph displayFlex={false}>{user.login}</Paragraph>
						</div>
						<div className="username">
							<Paragraph displayFlex={false} neon="magenta">USERNAME</Paragraph>
							<div className="flex items-center">
								<input disabled onBlur={() => {
									if (usernameInputRef.current !== null) {
										usernameInputRef.current.disabled = true;
									}
									if (editedUsername !== user.username) {
										handleConfirmEdit();
									}
								}}
									onKeyDown={(e) => {
										if (e.code === 'Enter') {
											if (usernameInputRef.current !== null) {
												usernameInputRef.current.blur();
											}
										}
									}
									}
									ref={usernameInputRef}
									className='font-press-start-2p input-username whitespace-pre disabled:text-ellipsis'
									onChange={(e) => {
										if (usernameInputRef.current !== null) {
											usernameInputRef.current.setAttribute("style", `width: min(${mesureTextWidth(usernameInputRef.current.value, usernameInputRef.current.className)}px, 100%)`);
										}
										setEditedUsername(e.target.value);
									}} value={editedUsername} />
								<button onFocus={handleEditClick2}><img src="icon-edit.svg" alt="Edit Icon" className="icon-edit ml-2" /></button>
							</div>
						</div>
						<div className="two-fa">
							<Paragraph displayFlex={false} neon="magenta">2FA AUTH</Paragraph>
							<div className={`toggle-button ${is2FAActive ? 'active' : ''}`} onClick={toggle2FA}>
								<svg className="toggle-button-circle" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
									<circle opacity="0.4" cx="8.5" cy="8.60492" r="8" fill="white" />
								</svg>
							</div>

							<Modal
								isOpen={modalIsOpen}
								onRequestClose={closeModal}
								contentLabel="2 FA MODAL"
								style={{
									content: {
										justifyContent: 'center',
										backgroundColor: '#110023',
										borderRadius: '16px',
										maxWidth: '700px',
										maxHeight: '450px',
										border: '1px solid #FFF',
										display: 'flex',
										flexDirection: 'column',
										zIndex: 999999,
									},
									overlay: {
										backgroundColor: 'rgba(0, 0, 0, 0.75)'
									}
								}}
							>

								{qrCodeURL && (
									<div className='content-2fa p-10 gap-5' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
										<p className='font text-center'>2FA ACTIVATION</p>
										<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
											<div className='flex flex-col gap-5 justify-center'>
												<img className="qr-code" src={qrCodeURL} alt="2FA QR Code" />
												<input
													className='input-2fa font-press-start-2p'
													type="text"
													placeholder="Enter 2FA code"
													value={twoFactorCode}
													onChange={(e) => setTwoFactorCode(e.target.value)}
												/>
												<Button color="blue" onClick={verify2FA}>Verify</Button>
											</div>
											<div className='flex flex-col ml-4 py-2 h-full ml-[20px]' style={{ borderLeft: '1px solid white', padding: '10px' }}>
												<Paragraph className='text-center justify-center items-center '>Please download the Google Authenticator, scan the QR CODE and enter the code to activate 2fa.</Paragraph>
											</div>
										</div>
									</div>
								)}
							</Modal>

						</div>
						<div className="status">
							<Paragraph displayFlex={false} neon="magenta">STATUS</Paragraph>
							<div className={classNames('status-indicator', {
								'backgroundOffline': user.status === 'offline',
								'backgroundOnline': user.status === 'online',
								'backgroundinGame': user.status === 'ongame'
							})}></div>
						</div>

					</div>
				</div>
				<input
					type="file"
					style={{ display: 'none' }}
					ref={fileInputRef}
					onChange={handleFileChange}
				/>
				<div className="card-container2">
					<div className='flex justify-between w-full'>
						<Paragraph displayFlex={false} >LVL.{(user.level + 1).toFixed(2)} / {user.level < 5 ? 'SILVER' : user.level < 10 ? 'GOLD' : 'PLATINIUM'}</Paragraph>
						<div className='flex'>
							<Paragraph neon="magenta" displayFlex={false} >WIN RATE:
								{(user.wins + user.losses) > 0 ? (user.wins * 100 / (user.wins + user.losses)).toFixed(2) : 0}%</Paragraph>
						</div>

					</div>
					<progress className="w-full" max="100" value={(user.level % 1) * 100} />
					<div className="flex w-full">
						<div className='flex flex-col justify-center items-center grow'>
							<p className='font-press-start-2p text-[36px] text-white'>{user.wins + user.losses}</p>
							<p className='font-press-start-2p text-[12px] text-white'>PLAYED</p>
						</div>
						<div className="w-[1px] my-3 bg-white" />
						<div className='flex flex-col justify-center items-center grow'>
							<p className='font-press-start-2p text-[36px] text-white'>{user.wins}</p>
							<p className='font-press-start-2p text-[12px] text-white'>WINS</p>
						</div>
						<div className="w-[1px] my-3 bg-white" />
						<div className='flex flex-col justify-center items-center grow'>
							<p className='font-press-start-2p text-[36px] text-white'>{user.losses}</p>
							<p className='font-press-start-2p text-[12px] text-white'>LOSSES</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default ProfileCard;