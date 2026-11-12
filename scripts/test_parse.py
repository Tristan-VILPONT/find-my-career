#!/usr/bin/env python3
"""Tests du parseur Onisep (salaire, masques, volume)."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from onisep_parse import (  # noqa: E402
    SOURCE_ZIP,
    html_to_text,
    mask_from_labels,
    pack_crit,
    parse_metiers,
    read_xml_bytes,
    salaire_debutant,
    INTERETS,
    STATUTS,
)


class SalaireTests(unittest.TestCase):
    def test_a_partir(self) -> None:
        text = "Salaire du débutant A partir de 1868 euros brut par mois, hors primes Intégrer le marché du travail"
        self.assertEqual(salaire_debutant(text), 1868)

    def test_entre_prend_le_minimum(self) -> None:
        text = "Salaire du débutant Entre 3000 et 2500 euros brut par mois Intégrer le marché"
        self.assertEqual(salaire_debutant(text), 2500)
        text = "Salaire du débutant Entre 1900 et 3166 euros brut par mois Intégrer le marché"
        self.assertEqual(salaire_debutant(text), 1900)

    def test_fourchette_de_a(self) -> None:
        text = "Salaire du débutant De 800 à 1700 euros brut par mois. Intégrer le marché"
        self.assertEqual(salaire_debutant(text), 1700)

    def test_ignore_journalier_et_exemple(self) -> None:
        jour = "Salaire du débutant De 350 à 450 euros brut par jour selon la saison Intégrer le marché"
        self.assertEqual(salaire_debutant(jour), 0)
        exemple = (
            "Salaire du débutant Variable. Par exemple, 5000 euros brut pour un documentaire "
            "Intégrer le marché"
        )
        self.assertEqual(salaire_debutant(exemple), 0)

    def test_hebdomadaire_cinema(self) -> None:
        text = (
            "Salaire du débutant Au cinéma, le salaire dépend du budget. "
            "La grille prévoit un salaire hebdomadaire minimal de 2 758 euros brut (base de 39h) "
            "Intégrer le marché"
        )
        self.assertEqual(salaire_debutant(text), 2758)

    def test_silence(self) -> None:
        self.assertEqual(salaire_debutant("Pas de chiffre ici."), 0)


class MasqueTests(unittest.TestCase):
    def test_statut_intermittent(self) -> None:
        mask = mask_from_labels(["salarié intermittent du spectacle", "salarié"], STATUTS, {"salarié intermittent du spectacle": "intermittent du spectacle"})
        self.assertEqual(mask, (1 << 3) | (1 << 8))

    def test_interet_bit_eleve(self) -> None:
        mask = mask_from_labels([INTERETS[29], INTERETS[0]], INTERETS)
        self.assertEqual(mask, (1 << 29) | 1)

    def test_html(self) -> None:
        self.assertEqual(html_to_text("<p>Bonjour&nbsp;toi</p>"), "Bonjour toi")


class PackTests(unittest.TestCase):
    def test_gardien(self) -> None:
        packed = pack_crit(
            {
                "identifiant": "MET.579",
                "lieu": "mixte",
                "lieu_confiance": "haute",
                "teletravail": "non",
                "teletravail_confiance": "faible",
                "horaires": "décalés-nuit-week-end",
                "horaires_confiance": "haute",
                "utilite": "oui",
                "utilite_confiance": "moyenne",
                "sensibilite": "faible",
                "sensibilite_confiance": "faible",
                "contrainte_geo": "faible",
                "contrainte_geo_confiance": "faible",
            }
        )
        self.assertEqual(packed, 43739)

    def test_inconnu_neutre(self) -> None:
        packed = pack_crit(
            {
                "identifiant": "MET.0",
                "lieu": "inconnu",
                "lieu_confiance": "",
                "teletravail": "inconnu",
                "teletravail_confiance": "",
                "horaires": "inconnu",
                "horaires_confiance": "",
                "utilite": "inconnu",
                "utilite_confiance": "",
                "sensibilite": "inconnu",
                "sensibilite_confiance": "",
                "contrainte_geo": "inconnu",
                "contrainte_geo_confiance": "",
            }
        )
        self.assertEqual(packed, 0)


class VolumeTests(unittest.TestCase):
    def test_xml_complet(self) -> None:
        if not SOURCE_ZIP.exists():
            self.skipTest("zip absent")
        rows = parse_metiers(read_xml_bytes(SOURCE_ZIP))
        self.assertEqual(len(rows), 1138)
        gardien = next(row for row in rows if row["id"] == "579")
        self.assertEqual(gardien["nom"], "gardien/ne de police municipale")
        self.assertEqual(gardien["salaire"], 1868)
        self.assertEqual(gardien["statuts"], 1)
        self.assertEqual(gardien["niveau"], 1)
        self.assertTrue(gardien["accroche"])


if __name__ == "__main__":
    unittest.main()
