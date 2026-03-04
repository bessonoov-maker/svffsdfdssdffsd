using UnityEngine;

public class CameraFollowX : MonoBehaviour
{
    [SerializeField] private Transform target;
    [SerializeField] private float xOffset = 4f;
    [SerializeField] private float smooth = 4f;

    private float maxX;

    private void LateUpdate()
    {
        float desiredX = target.position.x + xOffset;
        maxX = Mathf.Max(maxX, desiredX);

        Vector3 p = transform.position;
        p.x = Mathf.Lerp(p.x, maxX, Time.deltaTime * smooth);
        transform.position = p;
    }
}
