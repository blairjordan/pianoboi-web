import { useVoiceSave } from '../hooks/useVoiceSave';

interface VoiceSaveControlProps {
	onSave: () => void;
	language?: string;
	disabled?: boolean;
	className?: string;
}

export default function VoiceSaveControl({
	onSave,
	language,
	disabled = false,
	className = ''
}: VoiceSaveControlProps) {
	const { isSupported, isEnabled, isListening, error, start, stop } = useVoiceSave(
		onSave,
		language
	);

	let status = 'Voice save is off';
	if (!isSupported) status = 'Voice save is unavailable in this browser';
	else if (error) status = error;
	else if (isListening) status = 'Listening — say “save”';
	else if (isEnabled) status = 'Starting microphone…';

	return (
		<div className={`flex items-center gap-2 ${className}`.trim()}>
			<button
				type="button"
				aria-pressed={isEnabled}
				disabled={disabled || !isSupported}
				onClick={isEnabled ? stop : start}
				className={`rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
					isEnabled
						? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
						: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
				}`}
			>
				<i className={`fas ${isEnabled ? 'fa-microphone-slash' : 'fa-microphone'} mr-2`} />
				{isEnabled ? 'Stop voice save' : 'Start voice save'}
			</button>
			<span
				role="status"
				aria-live="polite"
				className={`text-xs ${error || !isSupported ? 'text-red-700' : 'text-gray-600'}`}
			>
				{status}
			</span>
		</div>
	);
}
