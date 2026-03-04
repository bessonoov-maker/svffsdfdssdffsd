using System.Collections.Generic;
using UnityEngine;

public class TerrainGenerator2D : MonoBehaviour
{
    [SerializeField] private Transform car;
    [SerializeField] private PhysicsMaterial2D groundMaterial;
    [SerializeField] private GameObject coinPrefab;
    [SerializeField] private GameObject fuelPrefab;

    [Header("Chunk")]
    [SerializeField] private float chunkLength = 35f;
    [SerializeField] private int pointsPerChunk = 18;
    [SerializeField] private int chunksAhead = 6;
    [SerializeField] private int chunksBehindToKeep = 3;

    [Header("Shape")]
    [SerializeField] private float noiseScale = 0.12f;
    [SerializeField] private float hillAmplitude = 3.5f;
    [SerializeField] private float baseHeight = -2.5f;

    private readonly Queue<GameObject> chunks = new();
    private readonly List<GameObject> pickups = new();
    private float generatedToX;

    private void Start()
    {
        generatedToX = -chunkLength;
        for (int i = 0; i < chunksAhead; i++) GenerateChunk();
    }

    private void Update()
    {
        while (generatedToX < car.position.x + chunksAhead * chunkLength)
            GenerateChunk();

        CleanupBehind();
    }

    private void GenerateChunk()
    {
        float startX = generatedToX;
        float endX = startX + chunkLength;
        generatedToX = endX;

        GameObject chunk = new($"Chunk_{startX:0}");
        chunk.transform.SetParent(transform);

        Vector2[] pts = new Vector2[pointsPerChunk];
        for (int i = 0; i < pointsPerChunk; i++)
        {
            float t = i / (pointsPerChunk - 1f);
            float x = Mathf.Lerp(startX, endX, t);
            float y = baseHeight + Mathf.PerlinNoise(x * noiseScale, 0f) * hillAmplitude;
            pts[i] = new Vector2(x, y);
        }

        var edge = chunk.AddComponent<EdgeCollider2D>();
        edge.points = pts;
        edge.sharedMaterial = groundMaterial;

        var line = chunk.AddComponent<LineRenderer>();
        line.positionCount = pts.Length;
        line.startWidth = 0.35f;
        line.endWidth = 0.35f;
        line.material = new Material(Shader.Find("Sprites/Default"));
        line.startColor = new Color(0.18f, 0.65f, 0.2f);
        line.endColor = line.startColor;
        for (int i = 0; i < pts.Length; i++) line.SetPosition(i, pts[i]);

        chunks.Enqueue(chunk);
        SpawnPickupsOnChunk(pts);
    }

    private void SpawnPickupsOnChunk(Vector2[] pts)
    {
        if (coinPrefab == null || fuelPrefab == null) return;

        int coinCount = Random.Range(2, 5);
        for (int i = 0; i < coinCount; i++)
        {
            int idx = Random.Range(1, pts.Length - 2);
            Vector3 pos = pts[idx] + Vector2.up * Random.Range(1.4f, 2.4f);
            pickups.Add(Instantiate(coinPrefab, pos, Quaternion.identity, transform));
        }

        if (Random.value < 0.33f)
        {
            int idx = Random.Range(2, pts.Length - 2);
            Vector3 pos = pts[idx] + Vector2.up * 2f;
            pickups.Add(Instantiate(fuelPrefab, pos, Quaternion.identity, transform));
        }
    }

    private void CleanupBehind()
    {
        float minX = car.position.x - chunksBehindToKeep * chunkLength;

        while (chunks.Count > 0)
        {
            GameObject oldest = chunks.Peek();
            if (oldest.transform.position.x + chunkLength > minX) break;
            chunks.Dequeue();
            Destroy(oldest);
        }

        for (int i = pickups.Count - 1; i >= 0; i--)
        {
            if (pickups[i] == null)
            {
                pickups.RemoveAt(i);
                continue;
            }

            if (pickups[i].transform.position.x < car.position.x - 50f)
            {
                Destroy(pickups[i]);
                pickups.RemoveAt(i);
            }
        }
    }
}
