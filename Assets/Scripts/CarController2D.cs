using UnityEngine;

public class CarController2D : MonoBehaviour
{
    [Header("Refs")]
    [SerializeField] private Rigidbody2D bodyRb;
    [SerializeField] private WheelJoint2D frontWheel;
    [SerializeField] private WheelJoint2D rearWheel;
    [SerializeField] private Rigidbody2D frontWheelRb;
    [SerializeField] private Rigidbody2D rearWheelRb;
    [SerializeField] private MobileInput mobileInput;

    [Header("Engine")]
    [SerializeField] private float baseMotorSpeed = 1300f;
    [SerializeField] private float baseTorque = 1300f;
    [SerializeField] private float engineLevelMultiplier = 0.15f;
    [SerializeField] private float maxWheelAngularVelocity = 35f;

    [Header("Fuel")]
    [SerializeField] private float idleFuelBurn = 2f;
    [SerializeField] private float throttleFuelBurn = 8f;

    [Header("Flip Check")]
    [SerializeField] private float flippedAngleThreshold = 130f;
    [SerializeField] private float flippedFailDelay = 1.5f;

    [Header("Suspension")]
    [SerializeField] private float baseSuspensionFrequency = 3.5f;
    [SerializeField] private float suspensionFrequencyPerLevel = 0.6f;

    private float motorSpeed;
    private float motorTorque;
    private bool fuelEmpty;
    private float flippedTimer;

    public void ApplyUpgrades(int engineLevel, int suspensionLevel)
    {
        float engineMult = 1f + engineLevel * engineLevelMultiplier;
        motorSpeed = baseMotorSpeed * engineMult;
        motorTorque = baseTorque * engineMult;

        float freq = baseSuspensionFrequency + suspensionLevel * suspensionFrequencyPerLevel;
        ApplySuspension(frontWheel, freq);
        ApplySuspension(rearWheel, freq);
    }

    private void Update()
    {
        if (RunGameManager.Instance == null) return;

        float input = GetDriveInput();
        bool hasInput = Mathf.Abs(input) > 0.05f;

        float burn = idleFuelBurn + (hasInput ? throttleFuelBurn : 0f);
        RunGameManager.Instance.ConsumeFuel(burn * Time.deltaTime);

        if (!fuelEmpty)
        {
            ApplyMotor(frontWheel, -input);
            ApplyMotor(rearWheel, -input);
        }
        else
        {
            DisableMotor(frontWheel);
            DisableMotor(rearWheel);
        }

        LimitWheelSpeed(frontWheelRb);
        LimitWheelSpeed(rearWheelRb);
        CheckFlipFail();
    }

    public void SetFuelEmpty() => fuelEmpty = true;

    private float GetDriveInput()
    {
        float key = 0f;
        if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) key += 1f;
        if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) key -= 1f;

        float touch = mobileInput == null ? 0f : mobileInput.DriveAxis;
        return Mathf.Clamp(key + touch, -1f, 1f);
    }

    private void ApplyMotor(WheelJoint2D joint, float input)
    {
        JointMotor2D motor = joint.motor;
        motor.motorSpeed = input * motorSpeed;
        motor.maxMotorTorque = motorTorque;
        joint.motor = motor;
        joint.useMotor = Mathf.Abs(input) > 0.01f;
    }

    private static void DisableMotor(WheelJoint2D joint)
    {
        joint.useMotor = false;
    }

    private void ApplySuspension(WheelJoint2D joint, float frequency)
    {
        JointSuspension2D suspension = joint.suspension;
        suspension.frequency = frequency;
        suspension.dampingRatio = 0.7f;
        joint.suspension = suspension;
    }

    private void LimitWheelSpeed(Rigidbody2D rb)
    {
        rb.angularVelocity = Mathf.Clamp(rb.angularVelocity, -maxWheelAngularVelocity, maxWheelAngularVelocity);
    }

    private void CheckFlipFail()
    {
        float z = Mathf.Abs(Mathf.DeltaAngle(bodyRb.rotation, 0f));
        bool upsideDown = z > flippedAngleThreshold;

        if (!upsideDown)
        {
            flippedTimer = 0f;
            return;
        }

        flippedTimer += Time.deltaTime;
        if (flippedTimer >= flippedFailDelay)
        {
            RunGameManager.Instance.TriggerGameOver();
        }
    }
}
