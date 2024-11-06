import React from 'react';
import Paragraph from '../ui/Paragraph';
import { Log } from '@/types';


type LogsProps = {
	logs: Log[];
	className?: string;
};

const Logs: React.FC<LogsProps> = ({ logs, className }) => {

	return (
		<div className={`log ${className}`}
			style={{ width: '100%', height: '100%', padding: '9px 9px', borderRadius: '16px', borderWidth: '1px', borderColor: 'white', backgroundColor: '#1D1A40' }}>

			<Paragraph neon="magenta">LOGS</Paragraph>  { }

			<div className="overflow-y-auto flex-[1_0_0] pr-2 w-full h-full"
			>
				<div className="logs text-left p-2 w-full min-h-full" style={{ borderRadius: '8px', backgroundColor: '#110023', width: '100%' }}>

					{logs && logs.length > 0 && (
						logs.map((log, index) => (
							<div key={index} className="text-left">
								<Paragraph displayFlex={false} size="small" className={log.type === 'normal' ? 'text-white' : log.type === 'highlight' ? 'text-[#ff00ff]' : 'text-[#00ffff]'}>
									{log.time}: {log.message}
								</Paragraph>
							</div>
						))
					)}
				</div>

			</div >
		</div >
	);
};

export default Logs;
