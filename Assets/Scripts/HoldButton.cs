using UnityEngine;
using UnityEngine.Events;
using UnityEngine.EventSystems;

public class HoldButton : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IPointerExitHandler
{
    [SerializeField] private UnityEvent<bool> onHoldChanged;

    public void OnPointerDown(PointerEventData eventData) => onHoldChanged.Invoke(true);
    public void OnPointerUp(PointerEventData eventData) => onHoldChanged.Invoke(false);
    public void OnPointerExit(PointerEventData eventData) => onHoldChanged.Invoke(false);
}
