import { Injectable } from '@angular/core';

type Preferences = {
  defaultVideoDeviceId?: string;
};

@Injectable({
  providedIn: 'root',
})
export class PreferencesService {
  private readonly STORAGE_KEY = 'inventory_preferences';

  public getDefaultVideoDeviceId(): string | null {
    try {
      const preferences = localStorage.getItem(this.STORAGE_KEY);
      if (preferences) {
        const parsed = JSON.parse(preferences) as Preferences;
        return parsed.defaultVideoDeviceId || null;
      }
    } catch (error) {
      console.error('Error getting default video device ID:', error);
    }
    return null;
  }

  public setDefaultVideoDeviceId(deviceId: string): void {
    try {
      const existingPreferences = localStorage.getItem(this.STORAGE_KEY);
      const preferences: Preferences = existingPreferences ? JSON.parse(existingPreferences) as Preferences : {};
      preferences.defaultVideoDeviceId = deviceId;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error setting default video device ID:', error);
    }
  }
}