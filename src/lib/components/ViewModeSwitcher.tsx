interface Props {
	viewMode: 'keyboard' | 'sheet';
	onChange: (mode: 'keyboard' | 'sheet') => void;
}

export default function ViewModeSwitcher({ viewMode, onChange }: Props) {
	return (
		<div className="flex overflow-hidden rounded-md border shadow-sm">
			{(['keyboard', 'sheet'] as const).map((mode) => (
				<button
					key={mode}
					type="button"
					className={`flex-1 px-2 py-1 text-sm font-medium transition-colors ${
						viewMode === mode ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
					}`}
					onClick={() => onChange(mode)}
				>
					<div className="flex items-center justify-center gap-1">
						<i className={`fas ${mode === 'keyboard' ? 'fa-keyboard' : 'fa-music'} text-xs`} />
						<span className="hidden text-xs sm:inline">
							{mode === 'keyboard' ? 'Keyboard' : 'Sheet'}
						</span>
					</div>
				</button>
			))}
		</div>
	);
}
