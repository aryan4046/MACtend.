import os
import sys
import unittest

# Ensure we can import backend packages
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from rssi_service import classify_signal_quality, calculate_stats, generate_mock_rssi

class TestRSSIFunctions(unittest.TestCase):
    
    def test_classify_signal_quality(self):
        self.assertEqual(classify_signal_quality(None), "Unknown")
        self.assertEqual(classify_signal_quality(-40), "Excellent")
        self.assertEqual(classify_signal_quality(-50), "Excellent")
        self.assertEqual(classify_signal_quality(-55), "Good")
        self.assertEqual(classify_signal_quality(-60), "Good")
        self.assertEqual(classify_signal_quality(-65), "Fair")
        self.assertEqual(classify_signal_quality(-75), "Weak")
        self.assertEqual(classify_signal_quality(-90), "Very Weak")

    def test_calculate_stats_empty(self):
        empty_stats = calculate_stats([])
        self.assertIsNone(empty_stats["current"])
        self.assertIsNone(empty_stats["average"])
        self.assertEqual(empty_stats["stability_label"], "Unknown")
        self.assertEqual(empty_stats["quality"], "Unknown")

    def test_calculate_stats_single(self):
        single_stats = calculate_stats([-55])
        self.assertEqual(single_stats["current"], -55)
        self.assertEqual(single_stats["average"], -55)
        self.assertEqual(single_stats["min"], -55)
        self.assertEqual(single_stats["max"], -55)
        self.assertEqual(single_stats["stability_pct"], 100)
        self.assertEqual(single_stats["stability_label"], "Stable")
        self.assertEqual(single_stats["quality"], "Good")
        self.assertEqual(single_stats["trend"], "Stable")

    def test_calculate_stats_multiple(self):
        # Stable list
        stable_stats = calculate_stats([-50, -51, -50, -51, -50])
        self.assertEqual(stable_stats["current"], -50)
        self.assertLess(stable_stats["min"], 0)
        self.assertEqual(stable_stats["stability_label"], "Stable")
        self.assertGreaterEqual(stable_stats["stability_pct"], 90)

        # Fluctuating list
        fluctuating_stats = calculate_stats([-50, -80, -40, -90, -35])
        self.assertEqual(fluctuating_stats["stability_label"], "Fluctuating")
        self.assertLess(fluctuating_stats["stability_pct"], 50)

    def test_trends(self):
        # Improving trend (first element is the most recent)
        improving = calculate_stats([-50, -60, -70])
        self.assertEqual(improving["trend"], "Improving")
        
        # Degrading trend
        degrading = calculate_stats([-70, -60, -50])
        self.assertEqual(degrading["trend"], "Degrading")

        # Stable trend
        stable = calculate_stats([-60, -61, -60])
        self.assertEqual(stable["trend"], "Stable")

    def test_mock_rssi_generation(self):
        val1 = generate_mock_rssi("student123")
        val2 = generate_mock_rssi("student123")
        # In the same minute, the value should be close
        self.assertTrue(-95 <= val1 <= -30)
        self.assertTrue(-95 <= val2 <= -30)

if __name__ == "__main__":
    unittest.main()
