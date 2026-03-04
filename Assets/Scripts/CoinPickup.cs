using UnityEngine;

public class CoinPickup : MonoBehaviour
{
    [SerializeField] private int amount = 1;

    private void OnTriggerEnter2D(Collider2D other)
    {
        if (!other.CompareTag("CarBody")) return;
        RunGameManager.Instance.AddCoin(amount);
        Destroy(gameObject);
    }
}
