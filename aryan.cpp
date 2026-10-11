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

void registerPatient()
{
    Patient *newPatient = new Patient;

    cout << "\nEnter Patient ID: ";
    cin >> newPatient->id;

    cout << "Enter Patient Name: ";
    cin.ignore();
    cin.getline(newPatient->name, 50);

    cout << "Enter Age: ";
    cin >> newPatient->age;

    cout << "Enter Location/Village: ";
    cin.ignore();
    cin.getline(newPatient->location, 50);

    newPatient->next = NULL;

    if (head == NULL)
    {
        head = newPatient;
    }
    else
    {
        Patient *temp = head;

        while (temp->next != NULL)
        {
            temp = temp->next;
        }

        temp->next = newPatient;
    }

    cout << "\nPatient registered successfully!\n";
}

void displayPatients()
{
    if (head == NULL)
    {
        cout << "\nNo patients registered.\n";
        return;
    }

    Patient *temp = head;

    cout << "\n PATIENT LIST \n";

    while (temp != NULL)
    {
        cout << "Patient ID : " << temp->id << endl;
        cout << "Name       : " << temp->name << endl;
        cout << "Age        : " << temp->age << endl;
        cout << "Location   : " << temp->location << endl;
        temp = temp->next;
    }
}

