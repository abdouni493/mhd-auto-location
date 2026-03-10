-- SQL code to fix the inspection checklist items
-- This will populate the inspection_checklist_items table with default items

-- First, let's clear any existing data (optional - remove this if you want to keep existing data)
-- DELETE FROM inspection_checklist_items;

-- Insert default security items
INSERT INTO inspection_checklist_items (category, item_name, display_order) VALUES
('securite', 'Ceintures de sécurité', 1),
('securite', 'Freins', 2),
('securite', 'Feux', 3),
('securite', 'Pneus', 4),
('securite', 'Direction', 5),
('securite', 'Klaxon', 6),
('securite', 'Rétroviseurs', 7),
('securite', 'Essuie-glaces', 8),
('securite', 'Airbags', 9),
('securite', 'Triangle de signalisation', 10),
('securite', 'Extincteur', 11),
('securite', 'Cric et roue de secours', 12);

-- Insert default equipment items
INSERT INTO inspection_checklist_items (category, item_name, display_order) VALUES
('equipements', 'GPS', 1),
('equipements', 'Siège bébé', 2),
('equipements', 'Chaîne neige', 3),
('equipements', 'Câbles de démarrage', 4),
('equipements', 'Kit de premiers secours', 5),
('equipements', 'Radio/CD', 6),
('equipements', 'Climatisation', 7),
('equipements', 'Verrouillage centralisé', 8),
('equipements', 'Ouverture automatique portes', 9),
('equipements', 'Régulateur de vitesse', 10),
('equipements', 'Caméra de recul', 11),
('equipements', 'Capteurs de stationnement', 12);

-- Insert default comfort/cleanliness items
INSERT INTO inspection_checklist_items (category, item_name, display_order) VALUES
('confort', 'Sièges', 1),
('confort', 'Volant', 2),
('confort', 'Tableau de bord', 3),
('confort', 'Éclairage intérieur', 4),
('confort', 'Vitres électriques', 5),
('confort', 'Rétroviseurs électriques', 6),
('confort', 'Autoradio', 7),
('confort', 'Prises USB', 8),
('confort', 'Cendrier', 9),
('confort', 'Coffre-fort', 10),
('confort', 'Tapis de sol', 11),
('confort', 'Propreté générale', 12);

-- Verify the data was inserted
SELECT category, COUNT(*) as item_count
FROM inspection_checklist_items
GROUP BY category
ORDER BY category;