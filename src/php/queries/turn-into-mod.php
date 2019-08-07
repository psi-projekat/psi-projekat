<?php
  class TurnIntoMod extends Query{
    public function query($pdo, $args){
      $st = $pdo->prepare('
        select idUser as id, isMod
        from User where token = ?
      ');
      $st->execute([$args->token]);
      $row = $st->fetch();

      if($row === false){
        $this->err('data');
        return;
      }

      if($row['isMod'] === 0){
        $this->err('forbidden');
        return;
      }

      $st = $pdo->prepare('
        select idUser as id, isMod
        from User where nick = ?
      ');
      $st->execute([$args->nick]);
      $row = $st->fetch();

      if($row === false){
        $this->err('data');
        return;
      }

      if($row['isMod'] === 1){
        $this->err('alreadyMod');
        return;
      }

      $pdo->prepare('
        update User
        set isMod = 1
        where idUser = ?
      ')->execute([$row['id']]);
      $this->succ();
    }
  }

  new TurnIntoMod();
?>