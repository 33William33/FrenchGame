// Level Management Utility for French Learning Game
const LevelManager = (function () {
    "use strict";

    const STORAGE_KEYS = {
        LEVEL_DATA: 'french_game_level_data',
        RANDOM_LIST: 'random_list'
    };

    /**
     * Save level selection data
     * @param {Object} levelData - Level information
     * @param {number} levelData.startIndex - Starting image index (1-based)
     * @param {number} levelData.endIndex - Ending image index (1-based)
     * @param {string} levelData.gameType - Type of game (match, spell, drop, drop-sentence)
     * @param {number} levelData.groupIndex - Group index (0-based)
     * @param {Array} levelData.images - Array of image objects for this level
     */
    function saveLevelData(levelData) {
        try {
            const dataToSave = {
                ...levelData,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            localStorage.setItem(STORAGE_KEYS.LEVEL_DATA, JSON.stringify(dataToSave));
            console.log('Level data saved:', dataToSave);
        } catch (error) {
            console.error('Error saving level data:', error);
        }
    }

    /**
     * Get saved level data
     * @returns {Object|null} Level data or null if not found
     */
    function getLevelData() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.LEVEL_DATA);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading level data:', error);
            return null;
        }
    }

    /**
     * Clear all level-related data (called on logout)
     */
    function clearAllData() {
        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            
            // Also clear other game-related keys
            const gameKeys = ['index', 'index1', 'random_list', 'random_list1', 'match_game_answers', 'spell_game_answers', 'drop_game_data'];
            gameKeys.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log('All level data cleared');
        } catch (error) {
            console.error('Error clearing level data:', error);
        }
    }

    /**
     * Reset game state when switching levels (but keep level data)
     */
    function resetGameState() {
        try {
            // Clear game state keys but keep level data
            const gameStateKeys = ['index', 'index1', 'random_list', 'random_list1', 'match_game_answers', 'spell_game_answers', 'drop_game_data'];
            gameStateKeys.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log('Game state reset for new level');
        } catch (error) {
            console.error('Error resetting game state:', error);
        }
    }

    /**
     * Check if we need to reset due to level change
     * @param {string} currentGameType - Current game type
     * @param {number} currentGroupIndex - Current group index
     * @returns {boolean} True if reset is needed
     */
    function shouldResetForLevelChange(currentGameType, currentGroupIndex) {
        const levelData = getLevelData();
        if (!levelData) return true;
        
        // Reset if game type or group changed
        if (levelData.gameType !== currentGameType || levelData.groupIndex !== currentGroupIndex) {
            console.log('Level or game type changed, resetting...');
            return true;
        }
        
        return false;
    }

    /**
     * Start a new game for the current level
     * @param {string} gameType - Game type (match, spell, drop)
     */
    function startNewGame(gameType) {
        const levelData = getLevelData();
        if (!levelData || !levelData.images) {
            console.warn('No level data found for starting new game');
            return false;
        }

        // Reset game indices for match/spell games (drop games don't use these)
        if (gameType !== 'drop' && gameType !== 'drop-sentence') {
            const indexKey = gameType === 'spell' ? 'index1' : 'index';
            localStorage.setItem(indexKey, JSON.stringify(0));
            
            // Generate fresh random list for match/spell games
            generateRandomListForLevel(gameType);
        }
        
        // Clear game-specific data
        if (gameType === 'drop') {
            localStorage.removeItem('drop_game_data');
        } else if (gameType === 'drop-sentence') {
            localStorage.removeItem('drop_sentence_game_data');
        } else if (gameType === 'spell') {
            localStorage.removeItem('spell_game_answers');
        } else {
            localStorage.removeItem('match_game_answers');
        }
        
        console.log(`New ${gameType} game started for level ${levelData.groupIndex + 1}`);
        return true;
    }

    /**
     * Generate and save random list for the current level
     * @param {string} gameType - Game type to generate random list for
     */
    function generateRandomListForLevel(gameType) {
        const levelData = getLevelData();
        if (!levelData || !levelData.images) {
            console.warn('No level data found for generating random list');
            return;
        }

        // Create array of image IDs from the level's images
        const imageIds = levelData.images.map(img => img._id);
        
        // Fisher-Yates shuffle algorithm
        for (let i = imageIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [imageIds[i], imageIds[j]] = [imageIds[j], imageIds[i]];
        }

        // Save to the appropriate localStorage key based on game type
        const storageKey = gameType === 'spell' ? 'random_list1' : 'random_list';
        localStorage.setItem(storageKey, JSON.stringify(imageIds));
        
        console.log(`Random list generated for ${gameType}:`, imageIds);
        return imageIds;
    }

    /**
     * Initialize level for a specific game
     * @param {string} gameType - Game type (match, spell, drop, drop-sentence)
     * @param {number} groupIndex - Group index (optional, for validation)
     */
    function initializeLevel(gameType, groupIndex = null) {
        const levelData = getLevelData();
        
        // If no level data exists, redirect to level selection
        if (!levelData || !levelData.images) {
            console.log('No level selected, redirecting to level selection...');
            window.location.href = `/group-select.html?game=${gameType}`;
            return false;
        }

        // Check if we need to reset due to level change
        if (groupIndex !== null && shouldResetForLevelChange(gameType, groupIndex)) {
            resetGameState();
        }

        // Generate random list if it doesn't exist
        const storageKey = gameType === 'spell' ? 'random_list1' : 'random_list';
        const existingRandomList = localStorage.getItem(storageKey);
        
        if (!existingRandomList) {
            generateRandomListForLevel(gameType);
        }

        return true;
    }

    /**
     * Get current level info as a string for display
     * @returns {string} Level info string
     */
    function getCurrentLevelInfo() {
        const levelData = getLevelData();
        if (!levelData) return 'No level selected';
        
        return `Level ${levelData.groupIndex + 1}: ${levelData.startIndex}-${levelData.endIndex} (${levelData.gameType})`;
    }

    /**
     * Get array of image IDs for the current level
     * @returns {Array} Array of image IDs or empty array if no level
     */
    function getCurrentLevelImages() {
        const levelData = getLevelData();
        if (!levelData || !levelData.images) return [];
        
        return levelData.images.map(img => img._id);
    }

    /**
     * Get current level number (1-based)
     * @returns {number} Current level number or 1 if no level selected
     */
    function getCurrentLevel() {
        const levelData = getLevelData();
        if (!levelData) return 1;
        
        return levelData.groupIndex + 1; // Convert from 0-based to 1-based
    }

    // Public API
    return {
        saveLevelData,
        getLevelData,
        clearAllData,
        resetGameState,
        shouldResetForLevelChange,
        generateRandomListForLevel,
        initializeLevel,
        getCurrentLevelInfo,
        getCurrentLevelImages,
        getCurrentLevel,
        startNewGame,
        
        // Constants
        STORAGE_KEYS
    };
})();

// Make it available globally
window.LevelManager = LevelManager;
