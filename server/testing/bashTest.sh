#!/bin/bash

sleep 5 > myPipe &
sleep 0.1
echo "call" > myPipe
sleep 0.1
echo "shove" > myPipe
sleep 0.1
echo "shove" > myPipe
sleep 0.1
echo "shove" > myPipe
sleep 0.1
echo "shove" > myPipe
sleep 0.1
echo "board" > myPipe
sleep 0.1
echo "debug" > myPipe
