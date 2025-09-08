// Enhanced Local Storage Service with validation and migration
export interface StorageSchema {
  version: number;
  todos: any[];
  projects: any[];
  dailyPlans: Record<string, any[]>;
  habits: any[];
  goals: any[];
  healthScores: any[];
  healthDimensions: any[];
  financialAccounts: any[];
  financialTransactions: any[];
  financialGoals: any[];
  passwords: any[];
  habitLegend: Record<string, any>;
  completedTasks: any[];
  archivedItems: any[];
  userPreferences: {
    theme: string;
    defaultView: string;
    notifications: boolean;
  };
  lastSync: string;
  backups: any[];
}

class LocalStorageService {
  private readonly STORAGE_KEY = 'daily-organizer-v2';
  private readonly BACKUP_KEY = 'daily-organizer-backups';
  private readonly CURRENT_VERSION = 2;
  private readonly MAX_BACKUPS = 5;

  // Initialize storage with default schema
  private getDefaultSchema(): StorageSchema {
    return {
      version: this.CURRENT_VERSION,
      todos: [],
      projects: [
        { id: 'unclassified', name: 'Unclassified', color: '#6B7280', position: 0 },
        { id: 'work', name: 'Work Projects', color: '#3B82F6', position: 1 },
        { id: 'personal', name: 'Personal Tasks', color: '#10B981', position: 2 },
        { id: 'health', name: 'Health & Fitness', color: '#F59E0B', position: 3 },
        { id: 'finance', name: 'Financial Planning', color: '#EF4444', position: 4 },
        { id: 'learning', name: 'Learning & Development', color: '#8B5CF6', position: 5 },
        { id: 'home', name: 'Home & Family', color: '#EC4899', position: 6 },
        { id: 'creative', name: 'Creative Projects', color: '#06B6D4', position: 7 },
        { id: 'travel', name: 'Travel & Adventures', color: '#84CC16', position: 8 }
      ],
      dailyPlans: {},
      habits: [],
      goals: [],
      healthScores: [],
      healthDimensions: [
        { id: 'spiritual', key: 'spiritual', label: 'Spiritual', description: 'You with your God/Universe', color: '#8B5CF6', position: 1 },
        { id: 'mental', key: 'mental', label: 'Mental', description: 'You with your mind', color: '#3B82F6', position: 2 },
        { id: 'social', key: 'social', label: 'Social', description: 'You with other people', color: '#10B981', position: 3 },
        { id: 'physical', key: 'physical', label: 'Physical', description: 'You with your body', color: '#F59E0B', position: 4 },
        { id: 'financial', key: 'financial', label: 'Financial', description: 'You with your resources', color: '#EF4444', position: 5 }
      ],
      financialAccounts: [
        { id: 'acc001', name: 'Primary Checking', type: 'checking', balance: 4850.32, currency: 'USD', isActive: true },
        { id: 'acc002', name: 'High Yield Savings', type: 'savings', balance: 18750.00, currency: 'USD', isActive: true },
        { id: 'acc003', name: 'Retirement 401k', type: 'investment', balance: 45200.85, currency: 'USD', isActive: true }
      ],
      financialTransactions: [
        {
          id: 'txn001',
          description: 'Freelance Web Design',
          amount: 2800,
          type: 'income',
          category: 'Freelance',
          date: new Date(2024, 11, 5).toISOString(),
          accountId: 'acc001',
          tags: ['work', 'freelance']
        },
        {
          id: 'txn002',
          description: 'Monthly Rent Payment',
          amount: 1450.00,
          type: 'expense',
          category: 'Housing',
          date: new Date(2024, 11, 1).toISOString(),
          accountId: 'acc001',
          tags: ['housing', 'monthly']
        },
        {
          id: 'txn003',
          description: 'Investment Dividend',
          amount: 340.75,
          type: 'income',
          category: 'Investment',
          date: new Date(2024, 11, 12).toISOString(),
          accountId: 'acc003',
          tags: ['investment', 'dividend']
        }
      ],
      financialGoals: [
        {
          id: 'goal001',
          name: 'Home Down Payment',
          targetAmount: 50000,
          currentAmount: 12500,
          deadline: new Date(2026, 5, 30).toISOString(),
          weeklyContribution: 400,
          category: 'savings',
          priority: 'high'
        },
        {
          id: 'goal002',
          name: 'European Trip',
          targetAmount: 8000,
          currentAmount: 2400,
          deadline: new Date(2025, 7, 15).toISOString(),
          weeklyContribution: 125,
          category: 'travel',
          priority: 'medium'
        }
      ],
      passwords: [
        {
          id: 'pwd001',
          name: 'Netflix Account',
          username: 'user.netflix@email.com',
          password: 'Stream2024!',
          pin: '1234',
          url: 'https://netflix.com',
          description: 'Family streaming account',
          category: 'Entertainment',
          lastUpdated: new Date().toISOString(),
          strength: 'strong'
        },
        {
          id: 'pwd002',
          name: 'GitHub Repository',
          username: 'developer_pro',
          password: 'Code#Secure456',
          pin: '5678',
          url: 'https://github.com',
          description: 'Development projects repository',
          category: 'Development',
          lastUpdated: new Date().toISOString(),
          strength: 'strong'
        }
      ],
      habitLegend: {
        completed: { icon: '✓', label: 'Completed', color: '#10B981' },
        partial: { icon: '◐', label: 'Partial', color: '#F59E0B' },
        missed: { icon: '✗', label: 'Missed', color: '#EF4444' },
        notScheduled: { icon: '−', label: 'Not Scheduled', color: '#6B7280' },
      },
      completedTasks: [],
      archivedItems: [],
      userPreferences: {
        theme: 'light',
        defaultView: 'week',
        notifications: true
      },
      lastSync: new Date().toISOString(),
      backups: []
    };
  }

  // Load data with validation and migration
  loadData(): StorageSchema {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      
      if (!stored) {
        console.log('🆕 No existing data found, initializing with defaults');
        const defaultData = this.getDefaultSchema();
        return defaultData;
      }

      const parsed = JSON.parse(stored);
      
      // Check version and migrate if needed
      if (!parsed.version || parsed.version < this.CURRENT_VERSION) {
        console.log('🔄 Migrating data from version', parsed.version || 1, 'to', this.CURRENT_VERSION);
        const migrated = this.migrateData(parsed);
        return migrated;
      }

      // Validate data structure
      const validated = this.validateData(parsed);
      console.log('✅ Data loaded successfully from localStorage');
      return validated;

    } catch (error) {
      console.error('❌ Failed to load data from localStorage:', error);
      console.log('🔄 Falling back to default data');
      const defaultData = this.getDefaultSchema();
      return defaultData;
    }
  }

  // Save data with backup
  saveData(data: Partial<StorageSchema>): void {
    try {
      // Create backup before saving
      this.createBackup();

      // Save the provided data directly
      const dataToSave = {
        ...data,
        version: this.CURRENT_VERSION,
        lastSync: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
      console.log('💾 Data saved to localStorage successfully');

    } catch (error) {
      console.error('❌ Failed to save data to localStorage:', error);
      
      // Try to clear some space and retry
      this.cleanupStorage();
      try {
        const dataToSave = {
          ...data,
          version: this.CURRENT_VERSION,
          lastSync: new Date().toISOString()
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
        console.log('💾 Data saved after cleanup');
      } catch (retryError) {
        console.error('❌ Failed to save even after cleanup:', retryError);
      }
    }
  }

  // Update specific data section
  updateSection<K extends keyof StorageSchema>(section: K, data: StorageSchema[K]): void {
    const existing = this.loadData();
    existing[section] = data;
    this.saveData(existing);
  }

  // Add item to array section
  addToSection<K extends keyof StorageSchema>(
    section: K, 
    item: StorageSchema[K] extends any[] ? StorageSchema[K][0] : never
  ): void {
    const existing = this.loadData();
    if (Array.isArray(existing[section])) {
      (existing[section] as any[]).push(item);
      this.saveData(existing);
    }
  }

  // Update item in array section
  updateInSection<K extends keyof StorageSchema>(
    section: K,
    itemId: string,
    updates: Partial<StorageSchema[K] extends any[] ? StorageSchema[K][0] : never>
  ): void {
    const existing = this.loadData();
    if (Array.isArray(existing[section])) {
      const items = existing[section] as any[];
      const index = items.findIndex(item => item.id === itemId);
      if (index !== -1) {
        items[index] = { ...items[index], ...updates };
        this.saveData(existing);
      }
    }
  }

  // Remove item from array section
  removeFromSection<K extends keyof StorageSchema>(section: K, itemId: string): void {
    const existing = this.loadData();
    if (Array.isArray(existing[section])) {
      existing[section] = (existing[section] as any[]).filter(item => item.id !== itemId);
      this.saveData(existing);
    }
  }

  // Create backup
  private createBackup(): void {
    try {
      const current = localStorage.getItem(this.STORAGE_KEY);
      if (!current) return;

      const backups = this.getBackups();
      const newBackup = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        data: JSON.parse(current)
      };

      backups.unshift(newBackup);
      
      // Keep only the latest backups
      if (backups.length > this.MAX_BACKUPS) {
        backups.splice(this.MAX_BACKUPS);
      }

      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backups));
      console.log('📦 Backup created successfully');

    } catch (error) {
      console.error('❌ Failed to create backup:', error);
    }
  }

  // Get all backups
  getBackups(): any[] {
    try {
      const stored = localStorage.getItem(this.BACKUP_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to load backups:', error);
      return [];
    }
  }

  // Restore from backup
  restoreFromBackup(backupId: string): boolean {
    try {
      const backups = this.getBackups();
      const backup = backups.find(b => b.id === backupId);
      
      if (!backup) {
        console.error('❌ Backup not found:', backupId);
        return false;
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backup.data));
      console.log('🔄 Restored from backup successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to restore from backup:', error);
      return false;
    }
  }

  // Migrate data from older versions
  private migrateData(oldData: any): StorageSchema {
    const defaultData = this.getDefaultSchema();
    
    // Migrate from version 1 to 2
    if (!oldData.version || oldData.version === 1) {
      return {
        ...defaultData,
        // Preserve existing data
        todos: oldData.todos || [],
        projects: oldData.projects || defaultData.projects,
        dailyPlans: oldData.dailyPlans || {},
        habits: oldData.habits || [],
        healthScores: oldData.healthScores || [],
        financialAccounts: oldData.financialAccounts || defaultData.financialAccounts,
        financialTransactions: oldData.financialTransactions || defaultData.financialTransactions,
        financialGoals: oldData.financialGoals || defaultData.financialGoals,
        passwords: oldData.passwords || defaultData.passwords,
        habitLegend: oldData.habitLegend || defaultData.habitLegend,
        // New fields in v2
        goals: [],
        healthDimensions: defaultData.healthDimensions,
        completedTasks: [],
        archivedItems: [],
        userPreferences: defaultData.userPreferences
      };
    }

    return oldData;
  }

  // Validate data structure
  private validateData(data: any): StorageSchema {
    const defaultData = this.getDefaultSchema();
    
    return {
      version: data.version || this.CURRENT_VERSION,
      todos: Array.isArray(data.todos) ? data.todos : [],
      projects: Array.isArray(data.projects) ? data.projects : defaultData.projects,
      dailyPlans: data.dailyPlans && typeof data.dailyPlans === 'object' ? data.dailyPlans : {},
      habits: Array.isArray(data.habits) ? data.habits : [],
      goals: Array.isArray(data.goals) ? data.goals : [],
      healthScores: Array.isArray(data.healthScores) ? data.healthScores : [],
      healthDimensions: Array.isArray(data.healthDimensions) ? data.healthDimensions : defaultData.healthDimensions,
      financialAccounts: Array.isArray(data.financialAccounts) ? data.financialAccounts : defaultData.financialAccounts,
      financialTransactions: Array.isArray(data.financialTransactions) ? data.financialTransactions : defaultData.financialTransactions,
      financialGoals: Array.isArray(data.financialGoals) ? data.financialGoals : defaultData.financialGoals,
      passwords: Array.isArray(data.passwords) ? data.passwords : defaultData.passwords,
      habitLegend: data.habitLegend && typeof data.habitLegend === 'object' ? data.habitLegend : defaultData.habitLegend,
      completedTasks: Array.isArray(data.completedTasks) ? data.completedTasks : [],
      archivedItems: Array.isArray(data.archivedItems) ? data.archivedItems : [],
      userPreferences: data.userPreferences && typeof data.userPreferences === 'object' ? data.userPreferences : defaultData.userPreferences,
      lastSync: data.lastSync || new Date().toISOString(),
      backups: Array.isArray(data.backups) ? data.backups : []
    };
  }

  // Clean up storage space
  private cleanupStorage(): void {
    try {
      // Remove old backups
      const backups = this.getBackups();
      if (backups.length > 2) {
        const keepBackups = backups.slice(0, 2);
        localStorage.setItem(this.BACKUP_KEY, JSON.stringify(keepBackups));
      }

      // Clear other app data if needed
      const keysToCheck = Object.keys(localStorage);
      keysToCheck.forEach(key => {
        if (key.startsWith('daily-organizer-') && key !== this.STORAGE_KEY && key !== this.BACKUP_KEY) {
          localStorage.removeItem(key);
        }
      });

      console.log('🧹 Storage cleanup completed');
    } catch (error) {
      console.error('❌ Storage cleanup failed:', error);
    }
  }

  // Export data for backup
  exportData(): string {
    const data = this.loadData();
    return JSON.stringify(data, null, 2);
  }

  // Import data from backup
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      const validated = this.validateData(data);
      this.saveData(validated);
      console.log('📥 Data imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to import data:', error);
      return false;
    }
  }

  // Clear all data
  clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.BACKUP_KEY);
    console.log('🗑️ All data cleared');
  }

  // Get storage usage info
  getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      const used = new Blob([localStorage.getItem(this.STORAGE_KEY) || '']).size;
      const available = 5 * 1024 * 1024; // Approximate 5MB limit
      const percentage = (used / available) * 100;
      
      return { used, available, percentage };
    } catch (error) {
      return { used: 0, available: 5 * 1024 * 1024, percentage: 0 };
    }
  }
}

export const localStorageService = new LocalStorageService();