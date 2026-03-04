using UnityEngine;

public static class GameData
{
    public const int MaxUpgradeLevel = 5;
    private static readonly int[] UpgradeCosts = { 50, 100, 200, 400, 800 };

    public static int TotalCoins
    {
        get => PlayerPrefs.GetInt(nameof(TotalCoins), 0);
        set { PlayerPrefs.SetInt(nameof(TotalCoins), Mathf.Max(0, value)); PlayerPrefs.Save(); }
    }

    public static int EngineLevel
    {
        get => PlayerPrefs.GetInt(nameof(EngineLevel), 0);
        set { PlayerPrefs.SetInt(nameof(EngineLevel), Mathf.Clamp(value, 0, MaxUpgradeLevel)); PlayerPrefs.Save(); }
    }

    public static int FuelLevel
    {
        get => PlayerPrefs.GetInt(nameof(FuelLevel), 0);
        set { PlayerPrefs.SetInt(nameof(FuelLevel), Mathf.Clamp(value, 0, MaxUpgradeLevel)); PlayerPrefs.Save(); }
    }

    public static int SuspensionLevel
    {
        get => PlayerPrefs.GetInt(nameof(SuspensionLevel), 0);
        set { PlayerPrefs.SetInt(nameof(SuspensionLevel), Mathf.Clamp(value, 0, MaxUpgradeLevel)); PlayerPrefs.Save(); }
    }

    public static int GetCostForLevel(int currentLevel)
    {
        if (currentLevel < 0 || currentLevel >= UpgradeCosts.Length) return -1;
        return UpgradeCosts[currentLevel];
    }

    public static bool TryBuyUpgrade(UpgradeType type)
    {
        int level = GetLevel(type);
        if (level >= MaxUpgradeLevel) return false;

        int cost = GetCostForLevel(level);
        if (TotalCoins < cost) return false;

        TotalCoins -= cost;
        SetLevel(type, level + 1);
        return true;
    }

    public static int GetLevel(UpgradeType type)
    {
        return type switch
        {
            UpgradeType.Engine => EngineLevel,
            UpgradeType.FuelTank => FuelLevel,
            UpgradeType.Suspension => SuspensionLevel,
            _ => 0,
        };
    }

    public static void SetLevel(UpgradeType type, int level)
    {
        switch (type)
        {
            case UpgradeType.Engine: EngineLevel = level; break;
            case UpgradeType.FuelTank: FuelLevel = level; break;
            case UpgradeType.Suspension: SuspensionLevel = level; break;
        }
    }
}

public enum UpgradeType
{
    Engine,
    FuelTank,
    Suspension,
}
