#include <iostream>
#include <cstring>
using namespace std;

struct Patient
{
    int id;
    char name[50];
    int age;
    char location[50];

    Patient *next;
};

Patient *head = NULL;
const int MAX_QUEUE = 10;

struct EmergencyQueue
{
    int queue[MAX_QUEUE];
    int front;
    int rear;
};

EmergencyQueue emergency;

void initializeQueue()
{
    emergency.front = -1;
    emergency.rear = -1;
}

bool isQueueEmpty()
{
    return emergency.front == -1;
}

bool isQueueFull()
{
    return emergency.rear == MAX_QUEUE - 1;
}

void addEmergency()
{
    int patientId;

    cout << "\nEnter Patient ID: ";
    cin >> patientId;

    Patient *patient = findPatient(patientId);

    if (patient == NULL)
    {
        cout << "\nPatient not found!\n";
        return;
    }

    if (isQueueFull())
    {
        cout << "\nEmergency queue is full!\n";
        return;
    }

    if (emergency.front == -1)
    {
        emergency.front = 0;
    }

    emergency.rear++;

    emergency.queue[emergency.rear] = patientId;

    cout << "\nEmergency request added successfully!\n";
}

void displayEmergencyQueue()
{
    if (isQueueEmpty())
    {
        cout << "\nEmergency queue is empty.\n";
        return;
    }

    cout << "\n********** EMERGENCY QUEUE **********\n";

    for (int i = emergency.front; i <= emergency.rear; i++)
    {
        Patient *patient = findPatient(emergency.queue[i]);

        if (patient != NULL)
        {
            cout << "Patient ID : " << patient->id << endl;
            cout << "Name       : " << patient->name << endl;
            cout << "Location   : " << patient->location << endl;
            cout << "***************************\n";
        }
    }
}

int removeEmergency()
{
    if (isQueueEmpty())
    {
        return -1;
    }

    int patientId = emergency.queue[emergency.front];

    emergency.front++;

    if (emergency.front > emergency.rear)
    {
        emergency.front = -1;
        emergency.rear = -1;
    }

    return patientId;
}

const int MAX_HISTORY = 10;

struct Dispatch
{
    int patientId;
    int ambulanceId;
    int hospitalId;
};

Dispatch history[MAX_HISTORY];

int top = -1;

void pushHistory(int patientId, int ambulanceId, int hospitalId)
{
    if (top == MAX_HISTORY - 1)
    {
        cout << "\nDispatch history is full!\n";
        return;
    }

    top++;

    history[top].patientId = patientId;
    history[top].ambulanceId = ambulanceId;
    history[top].hospitalId = hospitalId;
}

void displayHistory()
{
    if (top == -1)
    {
        cout << "\nNo completed emergencies yet.\n";
        return;
    }

    cout << "\n********** DISPATCH HISTORY ************\n";

    for (int i = top; i >= 0; i--)
    {
        Patient *patient = findPatient(history[i].patientId);

        cout << "Patient ID    : "
             << history[i].patientId << endl;

        if (patient != NULL)
        {
            cout << "Patient Name  : "
                 << patient->name << endl;
        }

        cout << "Ambulance ID  : "
             << history[i].ambulanceId << endl;

        cout << "Hospital ID   : "
             << history[i].hospitalId << endl;

        cout << "****************************\n";
    }
}

void processEmergency()
{
    if (isQueueEmpty())
    {
        cout << "\nNo emergency requests available.\n";
        return;
    }

    int patientId = removeEmergency();

    Patient *patient = findPatient(patientId);

    if (patient == NULL)
    {
        cout << "\nPatient not found!\n";
        return;
    }

    cout << "\n********** PROCESSING EMERGENCY *********\n";

    cout << "Patient ID : " << patient->id << endl;
    cout << "Name       : " << patient->name << endl;
    cout << "Age        : " << patient->age << endl;
    cout << "Location   : " << patient->location << endl;

    int ambulanceIndex = findAvailableAmbulance();

    if (ambulanceIndex == -1)
    {
        cout << "\nNo ambulance is currently available.\n";

        if (emergency.front == -1)
        {
            emergency.front = 0;
            emergency.rear = 0;
        }
        else
        {
            emergency.rear++;
        }

        emergency.queue[emergency.rear] = patientId;

        return;
    }

    cout << "\nAvailable ambulance found.";

    cout << "\nAmbulance ID : "
         << ambulances[ambulanceIndex].id << endl;

    displayHospitals();

    int hospitalId;

    cout << "\nSelect Hospital ID: ";
    cin >> hospitalId;

    if (hospitalId < 1 || hospitalId > MAX_HOSPITALS)
    {
        cout << "\nInvalid hospital ID!\n";
        return;
    }

    int hospitalIndex = hospitalId - 1;

    ambulances[ambulanceIndex].available = false;

    pushHistory(
        patientId,
        ambulances[ambulanceIndex].id,
        hospitals[hospitalIndex].id
    );

    cout << "\n****************************************\n";
    cout << "         AMBULANCE DISPATCHED\n";
    cout << "******************************************\n";

    cout << "Patient   : "
         << patient->name << endl;

    cout << "Ambulance : AMB-"
         << ambulances[ambulanceIndex].id << endl;

    cout << "Hospital  : "
         << hospitals[hospitalIndex].name << endl;

    cout << "Status    : DISPATCHED\n";

    cout << "***************************************\n";
}
