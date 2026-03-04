using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class RunGameManager : MonoBehaviour
{
    public static RunGameManager Instance { get; private set; }

    [Header("Refs")]
    [SerializeField] private CarController2D car;
    [SerializeField] private TMP_Text distanceText;
    [SerializeField] private TMP_Text runCoinsText;
    [SerializeField] private Image fuelFill;
    [SerializeField] private GameObject gameOverPanel;

    [Header("Fuel")]
    [SerializeField] private float baseFuelMax = 100f;
    [SerializeField] private float fuelPerLevel = 20f;

    private float fuelCurrent;
    private float fuelMax;
    private int runCoins;
    private bool isGameOver;

    public bool HasFuel => fuelCurrent > 0.01f;

    private void Awake()
    {
        Instance = this;
        gameOverPanel.SetActive(false);
    }

    private void Start()
    {
        fuelMax = baseFuelMax + GameData.FuelLevel * fuelPerLevel;
        fuelCurrent = fuelMax;
        car.ApplyUpgrades(GameData.EngineLevel, GameData.SuspensionLevel);
    }

    private void Update()
    {
        if (isGameOver) return;

        float dist = Mathf.Max(0f, car.transform.position.x / 10f);
        distanceText.text = $"Distance: {dist:0.0} m";
        runCoinsText.text = $"Coins: {runCoins}";
        fuelFill.fillAmount = fuelCurrent / fuelMax;
    }

    public void ConsumeFuel(float amount)
    {
        if (isGameOver) return;
        fuelCurrent = Mathf.Max(0f, fuelCurrent - amount);

        if (fuelCurrent <= 0f)
        {
            car.SetFuelEmpty();
            Invoke(nameof(TriggerGameOver), 2f);
        }
    }

    public void AddFuelPercent(float percent)
    {
        if (isGameOver) return;
        fuelCurrent = Mathf.Min(fuelMax, fuelCurrent + fuelMax * percent);
    }

    public void AddCoin(int amount)
    {
        runCoins += amount;
    }

    public void TriggerGameOver()
    {
        if (isGameOver) return;
        isGameOver = true;
        GameData.TotalCoins += runCoins;
        gameOverPanel.SetActive(true);
    }

    public void RestartRun() => SceneManager.LoadScene("RunScene");

    public void BackToGarage() => SceneManager.LoadScene("GarageScene");
}
