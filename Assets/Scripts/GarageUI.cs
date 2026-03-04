using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class GarageUI : MonoBehaviour
{
    [System.Serializable]
    public class UpgradeRow
    {
        public UpgradeType type;
        public TMP_Text levelText;
        public TMP_Text costText;
        public Button upgradeButton;
    }

    [SerializeField] private TMP_Text totalCoinsText;
    [SerializeField] private UpgradeRow[] rows;

    private void Start()
    {
        foreach (var row in rows)
        {
            row.upgradeButton.onClick.AddListener(() =>
            {
                GameData.TryBuyUpgrade(row.type);
                Refresh();
            });
        }

        Refresh();
    }

    public void OnStartRun()
    {
        SceneManager.LoadScene("RunScene");
    }

    private void Refresh()
    {
        totalCoinsText.text = $"Total Coins: {GameData.TotalCoins}";

        foreach (var row in rows)
        {
            int level = GameData.GetLevel(row.type);
            row.levelText.text = $"Lvl {level}/{GameData.MaxUpgradeLevel}";

            if (level >= GameData.MaxUpgradeLevel)
            {
                row.costText.text = "MAX";
                row.upgradeButton.interactable = false;
                continue;
            }

            int cost = GameData.GetCostForLevel(level);
            row.costText.text = $"Cost: {cost}";
            row.upgradeButton.interactable = GameData.TotalCoins >= cost;
        }
    }
}
