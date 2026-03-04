using UnityEngine;

public class FuelPickup : MonoBehaviour
{
    [SerializeField, Range(0.05f, 1f)] private float fuelPercent = 0.3f;

    private void OnTriggerEnter2D(Collider2D other)
    {
        if (!other.CompareTag("CarBody")) return;
        RunGameManager.Instance.AddFuelPercent(fuelPercent);
        Destroy(gameObject);
    }
}
