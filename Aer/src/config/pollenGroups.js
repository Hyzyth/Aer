// PollenGroups.js - Organisation hiérarchique des pollens par famille

const POLLEN_GROUPS = {
    ASTERACEES: {
        name: 'ASTERACEES',
        icon: 'asteracees.png',
        species: ['ambroisie', 'armoise']
    },
    BETULACEES: {
        name: 'BETULACEES',
        icon: 'betulacees.png',
        species: ['aulne', 'bouleau']
    },
    OLEACEES: {
        name: 'OLEACEES',
        icon: 'oleacees.png',
        species: ['olivier']
    },
    POACEES: {
        name: 'POACEES',
        icon: 'poacees.png',
        species: ['graminees']
    }
};

// Mapping inverse : du pollen vers sa famille
const POLLEN_TO_FAMILY = {};
Object.keys(POLLEN_GROUPS).forEach(familyKey => {
    const family = POLLEN_GROUPS[familyKey];
    family.species.forEach(pollen => {
        POLLEN_TO_FAMILY[pollen] = familyKey;
    });
});

// Liste ordonnée des familles (alphabétique)
const ORDERED_FAMILIES = Object.keys(POLLEN_GROUPS).sort();

// Liste de tous les pollens disponibles
const ALL_POLLENS = [];
ORDERED_FAMILIES.forEach(family => {
    POLLEN_GROUPS[family].species.forEach(pollen => {
        ALL_POLLENS.push(pollen);
    });
});

// Fonction pour obtenir la famille d'un pollen
const getPollenFamily = (pollenName) => {
    return POLLEN_TO_FAMILY[pollenName] || null;
};

// Fonction pour obtenir tous les pollens d'une famille
const getFamilyPollens = (familyName) => {
    return POLLEN_GROUPS[familyName]?.species || [];
};

// Fonction pour obtenir l'icône d'une famille
const getFamilyIcon = (familyName) => {
    return POLLEN_GROUPS[familyName]?.icon || null;
};

// Fonction pour vérifier si un pollen existe
const isValidPollen = (pollenName) => {
    return ALL_POLLENS.includes(pollenName);
};

// Mapping des codes CSV vers les noms de pollens
const CSV_CODE_TO_POLLEN = {
    'code_ambroisie': 'ambroisie',
    'code_aulne': 'aulne',
    'code_armoise': 'armoise',
    'code_bouleau': 'bouleau',
    'code_graminees': 'graminees',
    'code_olivier': 'olivier'
};

const POLLEN_TO_CSV_CODE = {
    'ambroisie': 'code_ambroisie',
    'aulne': 'code_aulne',
    'armoise': 'code_armoise',
    'bouleau': 'code_bouleau',
    'graminees': 'code_graminees',
    'olivier': 'code_olivier'
};