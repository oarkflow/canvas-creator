import {derived, mutable} from "@anchorlib/react";

export class ThemeStore {
	state = mutable({
		mode: 'light' as 'light' | 'dark',
	});
	
	isDark = derived(() => this.state.mode === 'dark');
	
	toggle() {
		this.state.mode = this.state.mode === 'light' ? 'dark' : 'light';
		if (typeof window !== 'undefined') {
			localStorage.setItem('theme', this.state.mode);
		}
	}
	
	init() {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('theme');
			if (saved === 'light' || saved === 'dark') {
				this.state.mode = saved;
			}
		}
	}
}