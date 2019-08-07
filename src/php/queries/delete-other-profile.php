<?php
  class DeleteOtherProfile extends Query{
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
        // Moderator cannot delete other moderator's profile
        $this->err('forbidden');
        return;
      }

      $pdo->prepare('
        delete from User
        where idUser = ?
      ')->execute([$row['id']]);
      $this->succ();
    }
  }

  new DeleteOtherProfile();
?>