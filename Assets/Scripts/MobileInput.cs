using UnityEngine;

public class MobileInput : MonoBehaviour
{
    public float DriveAxis { get; private set; }

    public void SetGas(bool pressed)
    {
        if (pressed) DriveAxis = 1f;
        else if (DriveAxis > 0f) DriveAxis = 0f;
    }

    public void SetBrake(bool pressed)
    {
        if (pressed) DriveAxis = -1f;
        else if (DriveAxis < 0f) DriveAxis = 0f;
    }
}
